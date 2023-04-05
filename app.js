const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//GET todos API
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//GET todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE
            id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//POST todo API
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { todo, priority, status } = todoDetails;
  const addTodoQuery = `
    INSERT INTO
      todo (todo, priority, status)
    VALUES
      (
         '${todo}',
          '${priority}',
          '${status}'
      );`;
  const dbResponse = await db.run(addTodoQuery);
  const id = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

//update todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "todo";
      break;
  }

  const previousTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const {
    todo = requestBody.todo,
    status = requestBody.status,
    priority = requestBody.priority,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
        todo
    SET
        todo='${todo}',
        status='${status}',
        priority='${priority}'
    WHERE
        id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//delete todo API
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
