import { GApp } from "./app";
const adminApp = new GApp("admin", 3000);
adminApp.serve();

const merchantApp = new GApp("merchant", 3001);
merchantApp.serve();

const buyerApp = new GApp("buyer", 3002);
buyerApp.serve();