import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 80, // 10 virtual users
  duration: '30s', // test duration
};

export default function () {
  http.get('https://faculty-ta.azurewebsites.net/');
  sleep(1);
}
