import { OrderModel } from "../models/Schemas/Order";
import { OrderRepostiory } from "../repository/order.repo";
const debug = require("debug")("gstock:service");
export class OrderService {
    OrderRepo: OrderRepostiory;
    constructor(private models) {
        this.OrderRepo = new OrderRepostiory(models.Order);
    }
    async buyerGetOrder(query, order_id= null) {
        return await this.OrderRepo.buyerGetOrder(query, order_id);
    }
    async merchantGetOrder(query, order_id= null) {
        return await this.OrderRepo.merchantGetOrder(query, order_id);
    }
    async adminGetOrder(query, order_id= null) {
        return await this.OrderRepo.adminGetOrder(query, order_id);
    }
}