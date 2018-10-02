import { CartModel } from "../models/Schemas/Cart";
import { CartRepository, ProductInCartGroupByMerchantAndVariant } from "../repository/cart.repo";
const debug = require("debug")("gstock:service");
export class CartService {
    CartRepo: CartRepository = this.models.CartRepository;

    constructor(private models) {
        console.log(this);
    }

     loadCartByUserId(userId): Promise<Array<ProductInCartGroupByMerchantAndVariant>> {
        return this.CartRepo.loadProductInCartGroupByMerchantAndVariant(userId).exec();
    }
}