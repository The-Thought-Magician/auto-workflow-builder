const app = require('./app');

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});