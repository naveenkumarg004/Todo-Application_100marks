const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const startServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// /todos/ API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", category, status, priority } = request.query;
  /*console.log(hasPriorityAndStatusProperties(request.query));
    console.log(hasCategoryAndStatus(request.query));
    console.log(hasCategoryAndPriority(request.query));
    console.log(hasPriorityProperty(request.query));
    console.log(hasStatusProperty(request.query));
    console.log(hasCategoryProperty(request.query));
    console.log(hasSearchProperty(request.query));*/
  /** switch case  */
  switch (true) {
    //scenario 1
    /**----------- has only status -------- */
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
            SELECT * FROM todo WHERE status = '${status}';
            `;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //scenario 2
    /**----------- has only priority -------- */
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        getTodoQuery = `
            select * from todo where priority = "${priority}"
        `;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 3
    /**----------- has priority  status-------- */
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "DONE" ||
          status === "IN PROGRESS"
        ) {
          getTodoQuery = `
                select * from todo 
                where priority = "${priority}" AND
                status = "${status}"
          `;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 4
    /**----------- has search_q -------- */
    case hasSearchProperty(request.query):
      getTodoQuery = `
            select * from todo where todo like "%${search_q}%"
        `;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => outPutResult(each)));
      break;
    //scenario 5
    /**----------- has Category Status -------- */
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "LEARNING" ||
        category === "HOME"
      ) {
        if (
          status === "TO DO" ||
          status === "DONE" ||
          status === "IN PROGRESS"
        ) {
          getTodoQuery = `
                    select * from todo
                     where status = "${status}" AND
                     category = "${category}"
                `;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => outPutResult(each)));
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario 6
    /**----------- has Category -------- */
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "LEARNING" ||
        category === "HOME"
      ) {
        getTodoQuery = `
            select * from todo where category = "${category}"    
            `;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario 7
    /**----------- has Category Priority-------- */
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          getTodoQuery = `
               select * from todo where 
               priority = "${priority}" AND category = "${category}"
            `;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //default get all todos
    default:
      getTodoQuery = `
        select * from todo
        `;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => outPutResult(each)));
  }
});

// /todos/:todoId/ API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        select * from todo where id = ${todoId} ;
    `;
  const data = await db.get(getTodoQuery);
  response.send(outPutResult(data));
});
// /agenda/ API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const requestQuery = `select * from todo where due_date = "${newDate}";`;
    const responseResult = await db.all(requestQuery);
    //console.log(responseResult);
    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// /todos/ API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, category, status, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `insert into
                   todo(id, todo, priority, category , status, due_date) 
                   values (${id}, "${todo}", "${priority}", "${category}", "${status}", "${postNewDueDate}") ;`;
          const responseResult = await db.run(postTodoQuery);
          console.log(responseResult);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});
// /todos/:todoId/ API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const preTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(preTodoQuery);
  console.log(previousTodo);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
        due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    // update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
        due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    // update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `update todo set
         todo = "${todo}" ,
         priority = "${priority}" ,
         status = "${status}" ,
         category = "${category}" ,
         due_date = "${dueDate}" 
         where id = ${todoId}
         `;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    //update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${newDate}' WHERE id = ${todoId} ;`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

///todos/:todoId/ API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
