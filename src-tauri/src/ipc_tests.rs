//! IPC contract tests: call commands through Tauri's real invoke pipeline (on
//! the mock runtime, so no window opens) with the same JSON the frontend sends.
//!
//! Unit tests in `domain/` and `transfer/` check the logic. These check the
//! *boundary*: command names, argument names, camelCase field names, and how
//! errors reach JavaScript. If someone renames a field in Rust without updating
//! `src/lib/api.ts`, these tests fail instead of the app.

use std::sync::Mutex;

use serde_json::{Value, json};
use tauri::ipc::{CallbackFn, InvokeBody};
use tauri::test::{INVOKE_KEY, MockRuntime, get_ipc_response, mock_builder, mock_context, noop_assets};
use tauri::webview::InvokeRequest;
use tauri::{App, WebviewWindow, WebviewWindowBuilder};
use tempfile::TempDir;

use crate::store::Store;
use crate::with_commands;

/// The origin of the app's own bundled pages. IPC from any other origin is
/// treated as remote and rejected by the ACL ("not allowed"). WebView2 on
/// Windows can't serve custom schemes directly, so Tauri uses an http URL there.
const LOCAL_ORIGIN: &str = if cfg!(windows) {
    "http://tauri.localhost"
} else {
    "tauri://localhost"
};

struct TestApp {
    // Kept alive for the duration of the test; dropping them tears things down.
    _app: App<MockRuntime>,
    webview: WebviewWindow<MockRuntime>,
    dir: TempDir,
}

impl TestApp {
    fn new() -> TestApp {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::load(dir.path().join("tasks.json")).unwrap();
        let app = with_commands(mock_builder())
            .manage(Mutex::new(store))
            .build(mock_context(noop_assets()))
            .unwrap();
        let webview = WebviewWindowBuilder::new(&app, "main", Default::default())
            .build()
            .unwrap();
        TestApp { _app: app, webview, dir }
    }

    /// Like `invoke(cmd, args)` in JS. `Ok` = resolved value, `Err` = rejection value.
    fn invoke(&self, cmd: &str, args: Value) -> Result<Value, Value> {
        get_ipc_response(
            &self.webview,
            InvokeRequest {
                cmd: cmd.into(),
                callback: CallbackFn(0),
                error: CallbackFn(1),
                url: LOCAL_ORIGIN.parse().unwrap(),
                body: InvokeBody::Json(args),
                headers: Default::default(),
                invoke_key: INVOKE_KEY.to_string(),
            },
        )
        .map(|body| body.deserialize::<Value>().unwrap())
    }

    /// Invoke and expect success.
    fn ok(&self, cmd: &str, args: Value) -> Value {
        self.invoke(cmd, args)
            .unwrap_or_else(|e| panic!("{cmd} failed: {e}"))
    }

    fn create(&self, title: &str, extra: Value) -> Value {
        let mut input = json!({ "title": title });
        input.as_object_mut().unwrap().extend(extra.as_object().unwrap().clone());
        self.ok("create_task", json!({ "input": input }))
    }

    fn titles(&self, query: Value) -> Vec<String> {
        let tasks = self.ok("list_tasks", json!({ "query": query }));
        tasks
            .as_array()
            .unwrap()
            .iter()
            .map(|t| t["title"].as_str().unwrap().to_string())
            .collect()
    }
}

#[test]
fn created_task_has_the_shape_the_frontend_expects() {
    let app = TestApp::new();
    let task = app.create(
        "  Write report ",
        json!({ "priority": "high", "dueDate": "2026-10-20", "tags": ["Work", "work "] }),
    );

    assert_eq!(task["title"], "Write report");
    assert_eq!(task["priority"], "high");
    assert_eq!(task["dueDate"], "2026-10-20");
    assert_eq!(task["tags"], json!(["work"]));
    assert_eq!(task["completed"], false);
    assert_eq!(task["completedAt"], Value::Null);
    // camelCase keys, and the backend sets id + timestamps.
    for key in ["id", "createdAt", "updatedAt", "description"] {
        assert!(task.get(key).is_some(), "missing key {key}");
    }
}

#[test]
fn validation_errors_reach_js_as_plain_strings() {
    let app = TestApp::new();
    let err = app.invoke("create_task", json!({ "input": { "title": "   " } })).unwrap_err();
    assert_eq!(err, json!("title cannot be empty"));
}

#[test]
fn unknown_and_malformed_ids_are_rejected() {
    let app = TestApp::new();
    let missing = "00000000-0000-0000-0000-000000000000";

    let err = app.invoke("delete_task", json!({ "id": missing })).unwrap_err();
    assert_eq!(err, json!(format!("task {missing} not found")));

    // Not a UUID at all: Tauri rejects it while parsing the arguments.
    assert!(app.invoke("delete_task", json!({ "id": "nope" })).is_err());
}

#[test]
fn full_crud_lifecycle() {
    let app = TestApp::new();
    let task = app.create("Draft", json!({}));
    let id = task["id"].clone();

    let updated = app.ok(
        "update_task",
        json!({ "id": id, "input": { "title": "Final", "priority": "low", "dueDate": null, "tags": [] } }),
    );
    assert_eq!(updated["title"], "Final");
    assert_eq!(updated["priority"], "low");

    let done = app.ok("set_completed", json!({ "id": id, "completed": true }));
    assert_eq!(done["completed"], true);
    assert!(done["completedAt"].is_string());

    app.ok("delete_task", json!({ "id": id }));
    assert!(app.titles(json!({})).is_empty());
}

#[test]
fn list_tasks_applies_filters_and_sorting_from_json() {
    let app = TestApp::new();
    app.create("a-low", json!({ "priority": "low", "dueDate": "2026-01-10" }));
    app.create("b-high", json!({ "priority": "high", "dueDate": "2026-01-20", "tags": ["work"] }));
    app.create("c-none", json!({ "priority": "high" }));

    // Sort by priority descending; ties broken newest-first.
    let by_priority = app.titles(json!({ "sortBy": "priority", "sortDir": "desc" }));
    assert_eq!(by_priority, vec!["c-none", "b-high", "a-low"]);

    // Date range with an open end, sorted by due date ascending.
    let in_range = app.titles(json!({
        "due": { "kind": "range", "from": "2026-01-05", "to": null },
        "sortBy": "dueDate", "sortDir": "asc"
    }));
    assert_eq!(in_range, vec!["a-low", "b-high"]);

    assert_eq!(app.titles(json!({ "tag": "work" })), vec!["b-high"]);
    assert_eq!(app.titles(json!({ "search": "LOW" })), vec!["a-low"]);
    assert_eq!(app.titles(json!({ "due": { "kind": "noDate" } })), vec!["c-none"]);
}

#[test]
fn stats_tags_and_clear_completed() {
    let app = TestApp::new();
    let a = app.create("a", json!({ "tags": ["home"] }));
    app.create("b", json!({ "tags": ["work", "home"] }));
    app.ok("set_completed", json!({ "id": a["id"], "completed": true }));

    let stats = app.ok("get_stats", json!({}));
    assert_eq!(stats["total"], 2);
    assert_eq!(stats["active"], 1);
    assert_eq!(stats["completed"], 1);
    assert_eq!(app.ok("list_tags", json!({})), json!(["home", "work"]));

    assert_eq!(app.ok("clear_completed", json!({})), json!(1));
    assert_eq!(app.titles(json!({})), vec!["b"]);
}

#[test]
fn changes_are_persisted_to_disk() {
    let app = TestApp::new();
    app.create("survives restart", json!({}));

    // A fresh Store reading the same file sees the task.
    let reloaded = Store::load(app.dir.path().join("tasks.json")).unwrap();
    assert_eq!(reloaded.tasks().len(), 1);
    assert_eq!(reloaded.tasks()[0].title, "survives restart");
}
