const app = require('./app');
const db = require('./db');

const port = process.env.PORT || 3000;
let server;
start();

async function start() {
    try {
        await db.connect();
        server = app.listen(port, () => {
            console.log("Listening on port " + port);
        });
    } catch(err) {
        console.error(err);
    }
}

function stop() {
    server.close( async () => {
      await db.disconnect();
      console.log("server stopped.");
      process.exit();
    });
}

process.on('SIGINT', stop);