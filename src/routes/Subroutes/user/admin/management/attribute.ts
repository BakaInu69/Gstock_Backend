import { Request, Response, NextFunction, Router } from "express";
import { attributeController } from "../../../../../controllers";
/**
 * Category Management
 */

export default (config) => {
    const {
        addAttributeOptions,
        addExpress,
        addUIFloor,
        addVariantOptions,
        deleteAttributeOptions,
        updateAttributeOptions,
        updateUIFloors,
        updateUIFloorsOrder,
        updateBrands,
        getBrands,
        getAttributeOptions,
        getUIFloors,
        getExpress,
        getVariantOptions,
        merchantGetExpressProvider,
        getHomePageUIOptions,
        addHomePageUIOptions,
        homeImageUpload,
        createHomePageAds,
        updateAdsLink,
        getAdsLink
    } = attributeController(config);
    return Router()
        // .use("/", userPassport.isJWTValid)
        .post("/attribute", addAttributeOptions)
        .get("/attribute", getAttributeOptions)
        .put("/attribute", updateAttributeOptions)
        .delete("/attribute", deleteAttributeOptions)

        // .post("/variants", addVariantOptions)
        // .get("/variants", getVariantOptions)
        // .put("/variants", updateAttributeOptions)
        // .post("/variants/delete", deleteAttributeOptions)

        .post("/express", addExpress)
        .get("/express", getExpress)
        .put("/express", updateAttributeOptions)
        .post("/express/delete", deleteAttributeOptions)

        .get("/ui-options/floor", getUIFloors)
        .post("/ui-options/floor", addUIFloor)
        .put("/ui-options/floor", updateUIFloors)
        .put("/ui-options/floor/order", updateUIFloorsOrder)

        .get("/ui-options/home", getHomePageUIOptions)
        .post("/ui-options/home", addHomePageUIOptions)

        // .get("/ui-options/home/banner", getUIFloors)
        // .put("/ui-options/home/banner", updateUIFloors)
        .post("/ui-options/home/ads-image",
            homeImageUpload.fields([
                { name: "adsImg" },
                { name: "whichImage" },
            ]),
            (req: Request, res: Response, next: NextFunction) => {
                return res.status(200).send({ message: "Upload successfull" });
            }
        )
        .put("/ui-options/home/ads-link", updateAdsLink)
        .get("/ui-options/home/ads-link", getAdsLink)

        .post("/ui-options/home/brand-image",
            homeImageUpload.array("brandImg"),
            (req: Request, res: Response, next: NextFunction) => res.status(200).send({ message: "Upload succesfull" })
        )
        .put("/ui-options/home/brands", updateBrands)
        .get("/ui-options/home/brands", getBrands)
        .post("/ui-options/home/icon-image",
            homeImageUpload.array("iconImg"),
            (req: Request, res: Response, next: NextFunction) => {
                return res.status(200).send({ message: "Upload succesfull" });
            }
        );
};