import axios from "axios";

const apiPath = "http://139.99.144.72:8081";

export const httpService = (url, method, data = null, accessToken) => {
  return axios({
    url: apiPath + "/api" + url,
    method,
    data,
    timeout: 50000,
    headers: {
      Authorization: accessToken ? `LooLe  ${accessToken}` : null,
    },
  });
};
