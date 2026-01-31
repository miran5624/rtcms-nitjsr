import { io } from "socket.io-client";

// CHANGED: Port 3000 -> 4000 to match your server logs
const socket = io("http://localhost:4000"); 

console.log("⏳ Attempting to connect to http://localhost:4000...");

socket.on("connect", () => {
  console.log("✅ Connected to server with ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection Error:", err.message);
});

socket.on("new_complaint", (data) => {
  console.log("\n🔔 EVENT RECEIVED: new_complaint");
  console.log("Data:", data);
});

socket.on("complaint_status_change", (data) => {
  console.log("\n🔄 EVENT RECEIVED: complaint_status_change");
  console.log("Data:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});