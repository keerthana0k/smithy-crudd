$version: "2.0"
namespace com.example.taskmanager

use aws.protocols#restJson1
use smithy.api#http
use smithy.api#required
use smithy.api#readonly
use smithy.api#idempotent
use smithy.api#httpLabel

@restJson1
service TaskManager {
    version: "2025-09-05",
    operations: [
        CreateProject,
        GetProject,
        ListProjects,
        UpdateProject,
        DeleteProject
    ]
}

// ---------- Shared shapes ----------
string ProjectId

structure ProjectItem {
    @required projectId: ProjectId
    @required name: String
    description: String
    createdAt: String
    updatedAt: String
}

list ProjectItemList {
    member: ProjectItem
}

// ---------- CreateProject ----------
@http(method: "POST", uri: "/projects")
operation CreateProject {
    input: CreateProjectInput,
    output: CreateProjectOutput
}

structure CreateProjectInput {
    @required name: String
    description: String
}

structure CreateProjectOutput {
    @required project: ProjectItem
}

// ---------- GetProject ----------
@http(method: "GET", uri: "/projects/{projectId}")
@readonly
operation GetProject {
    input: GetProjectInput,
    output: GetProjectOutput
}

structure GetProjectInput {
    @required
    @httpLabel
    projectId: ProjectId
}

structure GetProjectOutput {
    @required project: ProjectItem
}

// ---------- ListProjects ----------
@http(method: "GET", uri: "/projects")
@readonly
operation ListProjects {
    output: ListProjectsOutput
}

structure ListProjectsOutput {
    items: ProjectItemList
    nextToken: String
}

// ---------- UpdateProject ----------
@http(method: "PATCH", uri: "/projects/{projectId}")
operation UpdateProject {
    input: UpdateProjectInput,
    output: UpdateProjectOutput
}

structure UpdateProjectInput {
    @required
    @httpLabel
    projectId: ProjectId
    name: String
    description: String
}

structure UpdateProjectOutput {
    @required project: ProjectItem
}

// ---------- DeleteProject ----------
@http(method: "DELETE", uri: "/projects/{projectId}")
@idempotent
operation DeleteProject {
    input: DeleteProjectInput,
    output: DeleteProjectOutput
}

structure DeleteProjectInput {
    @required
    @httpLabel
    projectId: ProjectId
}

structure DeleteProjectOutput {
    ok: Boolean
}
