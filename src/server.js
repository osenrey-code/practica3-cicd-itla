const { createApp } = require('./app');
const PORT = process.env.PORT || 3000;
createApp().listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);
