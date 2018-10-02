import orderRoutes from "./order/order";
import productRoutes from "./product/product";
import mgmtRoute from "./user/admin/management";
import { BuyerRoutes } from "./user/buyer/buyer";
import merchantRoutes from "./user/merchant/merchant";
import { UserRoutes } from "./user/user";
import logisticRoute from "./order/logistics";
import adminRoute from "../../controllers/user/admin/admin";

export default {
    orderRoutes,
    productRoutes,
    ...mgmtRoute,
    BuyerRoutes,
    merchantRoutes,
    adminRoute,
    logisticRoute,
    UserRoutes,
};