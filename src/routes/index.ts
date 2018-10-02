import adminRoutes from "./admin";
import buyerRoutes from "./buyer";
import merchantRoutes from "./merchant";

export default(role) => {
    return    {
        "admin": adminRoutes,
        "buyer": buyerRoutes,
        "merchant": merchantRoutes
    }[role];
    // function registerAPI() {

    // }
};