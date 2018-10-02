import { Router } from "express";
import { rewardProductController } from "../../../../../controllers/";

/**
 * Reward product routes.
 */
export default (config) => {
    const {
        getRewardProduct,
        removeRewardProduct,
        removeAllRewardProduct,
        createRewardProduct,
        updateRewardProduct,
        getAllRewardPts
    } = rewardProductController(config);
    return Router()
        .get("/points", getAllRewardPts)
        .get("/", getRewardProduct)
        .post("/", createRewardProduct)
        .put("/", updateRewardProduct)
        .delete("/", removeRewardProduct)
        .delete("/all", removeRewardProduct)
        .get("/search");
};

