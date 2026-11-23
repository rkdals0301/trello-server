# trello-server
- trello-server

## Technologies
- Node.js
- Express
- JSON Web Token
- Morgan
- Sequelize
- SQLite3

## Lecture
- https://www.inflearn.com/course/vuejs

## Reference
- https://github.com/jeonghwan-kim/lecture-vue-trello-server

## Website
- https://rkdals0301.github.io/trello/

## Development

Use Node.js 22 or later. Run `npm ci` followed by `npm run dev` to start
the server at `http://localhost:3000`. The development entry point resets
its SQLite database on startup. It defaults to `db-dev.sqlite` and supports
an alternate location through `SQLITE_STORAGE`.

Run `npm test` for the HTTP integration tests. The tests use an in-memory
SQLite database and a loopback HTTP server.
