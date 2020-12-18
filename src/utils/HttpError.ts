//
// This is the error class we throw for known errors
//

class HttpErrorClass extends Error {
    public status;
    constructor(status, message) {
      super(message);
      this.status = status;
    }
}
module.exports=HttpErrorClass;
