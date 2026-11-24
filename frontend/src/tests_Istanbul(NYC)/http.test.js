import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { client } from '../services/http';
import { API } from '../config/api';
vi.mock('axios',()=>({default:{create:vi.fn()}}));
vi.mock('../config/api',()=>({API:{auth:'http://auth.test/api',chambres:'http://chambres.test/api',disponibilites:'http://disponibilites.test/api',tarifs:'http://tarifs.test/api'}}));
describe('client HTTP Axios',()=>{
 let instance;
 beforeEach(()=>{localStorage.clear();vi.clearAllMocks();instance={interceptors:{request:{use:vi.fn()}}};axios.create.mockReturnValue(instance);});
 afterEach(()=>localStorage.clear());
 it.each(['auth','chambres','disponibilites','tarifs'])('configure la baseURL de %s',service=>{
  expect(client(service)).toBe(instance);expect(axios.create).toHaveBeenCalledWith({baseURL:API[service]});
  expect(instance.interceptors.request.use).toHaveBeenCalledWith(expect.any(Function));
 });
 function interceptor(){client('auth');return instance.interceptors.request.use.mock.calls[0][0];}
 it('ajoute le JWT aux en-têtes existants',()=>{
  localStorage.setItem('token','jwt-test');const config={headers:{Accept:'application/json'}};
  expect(interceptor()(config)).toBe(config);expect(config.headers).toEqual({Accept:'application/json',Authorization:'Bearer jwt-test'});
 });
 it('ne modifie pas les en-têtes sans token',()=>{
  const config={headers:{Accept:'application/json'}};expect(interceptor()(config)).toBe(config);
  expect(config.headers).toEqual({Accept:'application/json'});
 });
 it('relit le JWT à chaque requête',()=>{
  const run=interceptor();localStorage.setItem('token','first');expect(run({headers:{}}).headers.Authorization).toBe('Bearer first');
  localStorage.setItem('token','second');expect(run({headers:{}}).headers.Authorization).toBe('Bearer second');
  localStorage.removeItem('token');expect(run({headers:{}}).headers.Authorization).toBeUndefined();
 });
});
