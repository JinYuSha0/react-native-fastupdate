const axios = require('axios');

const {
  FASTUPDATE_APP_ID,
  FASTUPDATE_APP_SECRET,
  FASTUPDATE_DOMAIN = 'http://fixme',
} = process.env;

class RequestError extends Error {
  code;

  constructor(msg, code) {
    super(msg);
    this.code = code;
  }
}
exports.RequestError = RequestError;

const instance = axios.create({
  baseURL: FASTUPDATE_DOMAIN,
});

instance.interceptors.request.use(
  (config) => {
    config.headers.FASTUPDATE_APP_ID = FASTUPDATE_APP_ID;
    config.headers.FASTUPDATE_APP_SECRET = FASTUPDATE_APP_SECRET;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (response.data.code === 200) {
      return response.data.data;
    } else {
      throw new RequestError(response.data.data.msg, response.data.code);
    }
  },
  (error) => {
    throw new RequestError(
      error.response.data.data.msg,
      error.response.data.code
    );
  }
);

exports.request = instance;
