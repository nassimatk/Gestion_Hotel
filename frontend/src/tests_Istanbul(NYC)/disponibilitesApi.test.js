import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../services/disponibilitesApi';
import { client } from '../services/http';
const http = vi.hoisted(() => ({get:vi.fn(),post:vi.fn(),delete:vi.fn()}));
vi.mock('../services/http', () => ({client:vi.fn(() => http)}));
const params = {date_debut:'2027-01-10',date_fin:'2027-01-12'};
const body = {chambre_id:7,...params};
const cases = [
 ['liste des disponibilités',()=>api.getDisponibilites(params),'get',['/disponibilites',{params}]],
 ['vérification de chambre',()=>api.verifierChambre(7,params),'get',['/disponibilites/chambres/7',{params}]],
 ['création de réservation',()=>api.creerReservation(body),'post',['/reservations',body]],
 ['réservations personnelles',()=>api.mesReservations(),'get',['/reservations/mes']],
 ['toutes les réservations',()=>api.toutesReservations(),'get',['/reservations']],
 ['annulation de réservation',()=>api.annulerReservation(9),'delete',['/reservations/9']],
];
describe('disponibilitesApi',()=>{
 beforeEach(()=>{Object.values(http).forEach(mock=>mock.mockReset());});
 it('sélectionne le microservice disponibilités',()=>expect(client).toHaveBeenCalledWith('disponibilites'));
 it.each(cases)('%s : transmet la requête et la réponse',async(_,call,method,args)=>{
  const response={data:{id:9},status:200}; http[method].mockResolvedValue(response);
  expect(await call()).toBe(response); expect(http[method]).toHaveBeenCalledTimes(1); expect(http[method]).toHaveBeenCalledWith(...args);
 });
 it.each(cases)('%s : propage les erreurs',async(_,call,method)=>{
  const error=Object.assign(new Error('API indisponible'),{response:{status:503}}); http[method].mockRejectedValue(error);
  await expect(call()).rejects.toBe(error);
 });
});
