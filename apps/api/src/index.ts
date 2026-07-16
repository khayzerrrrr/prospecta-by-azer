import { app } from "./app";

const port = Number(process.env.PORT) || 3000;

app.listen({ port }, ({ hostname, port }) => {
  console.log(`VisitFlow API running at http://${hostname}:${port}`);
  console.log(`Swagger docs at http://${hostname}:${port}/docs`);
});
