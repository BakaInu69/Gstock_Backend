export function More(info?) {
    const infoList = Object.assign(
        {
            "error": {
                "message": "Exception",
                "detail": "Server error"
            }
        }, info);

    return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
        const oldValue = descriptor.value;
        descriptor.value = async function () {
            const value = await oldValue.apply(this, arguments);
            if (!value.status_code && !value.detail_code) {
                return arguments[2]();
            }
            const errorDetail = infoList[value.detail_code];
            const res = Object.assign(value, errorDetail);
            if (errorDetail) {
                return arguments[1].status(errorDetail.overwrite ? errorDetail.overwrite : value.status_code).json(res);
            } else {
                return arguments[1].status(value.status_code).json(res);
            }
        };
        return descriptor;
    };
}