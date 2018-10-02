async function isEmailExist  (email: string) {
  return await this.models.User.findOne({ "credential.email": email }).lean() ? true : false;
}
async function isStoreNameExist (storeName: string) {
  return await this.models.User.findOne({ "store.name": storeName }).lean() ? true : false;
}
async function loginUser(username, usergroup) {
  return await this.models.User.findOneAndUpdate({
    "credential.email": username.toLowerCase(),
    "credential.user_group": usergroup
  }, { "credential.last_login": new Date() }).select("credential");
}
async function createUser (user: {}) {
  return await await new this.models.User(user).save();
}
