import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tarifsApi, getTarifs, messageErreur } from '../services/tarifsApi';
import { client } from '../services/http';
const http = vi.hoisted(()=>({get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn()}));
vi.mock('../services/http',()=>({client:vi.fn(()=>http)}));
const params={chambre_id:7,arrivee:'2027-01-10',depart:'2027-01-12'};
const body={prix:900};
const reads=[
 ['liste',()=>tarifsApi.list('saisons',{page:2}),['/saisons',{params:{page:2}}]],
 ['calcul',()=>tarifsApi.calculer(params),['/tarifs/calcul',{params}]],
 ['tarifs',()=>tarifsApi.getAllTarifs(),['/tarifs']],
 ['saisons',()=>tarifsApi.getAllSaisons(),['/saisons']],
 ['promotions',()=>tarifsApi.getAllPromotions(),['/promotions']],
];
const writes=[
 ['création',()=>tarifsApi.create('tarifs',body),'post',['/tarifs',body]],
 ['modification',()=>tarifsApi.update('tarifs',7,body),'put',['/tarifs/7',body]],
 ['suppression',()=>tarifsApi.remove('tarifs',7),'delete',['/tarifs/7']],
];
describe('tarifsApi',()=>{
 beforeEach(()=>Object.values(http).forEach(m=>m.mockReset()));
 it('sélectionne le microservice tarifs',()=>expect(client).toHaveBeenCalledWith('tarifs'));
 it.each(reads)('%s : extrait data.data',async(_,call,args)=>{
  http.get.mockResolvedValue({data:{data:[{id:7}]}});
  expect(await call()).toEqual([{id:7}]); expect(http.get).toHaveBeenCalledWith(...args);
 });
 it.each([[],{total:1800},null,undefined])('accepte une réponse directe : %j',async data=>{
  http.get.mockResolvedValue({data}); expect(await tarifsApi.getAllTarifs()).toEqual(data);
 });
 it.each(writes)('%s : transmet le payload et retourne data',async(_,call,method,args)=>{
  const data={data:{id:7},message:'OK'}; http[method].mockResolvedValue({data});
  expect(await call()).toEqual(data); expect(http[method]).toHaveBeenCalledWith(...args);
 });
 it.each(reads)('%s : propage une erreur',async(_,call)=>{
  const e=new Error('Erreur réseau'); http.get.mockRejectedValue(e); await expect(call()).rejects.toBe(e);
 });
 it.each(writes)('%s : propage une erreur',async(_,call,method)=>{
  const e=new Error('Accès refusé'); http[method].mockRejectedValue(e); await expect(call()).rejects.toBe(e);
 });
 it('getTarifs accepte arrivee et depart',async()=>{
  http.get.mockResolvedValue({data:{total:1800}}); expect(await getTarifs(params)).toEqual({total:1800});
  expect(http.get).toHaveBeenCalledWith('/tarifs/calcul',{params});
 });
 it('getTarifs accepte date_debut et date_fin',async()=>{
  http.get.mockResolvedValue({data:{total:1800}});
  await getTarifs({chambre_id:7,date_debut:params.arrivee,date_fin:params.depart});
  expect(http.get).toHaveBeenCalledWith('/tarifs/calcul',{params});
 });
 it('getTarifs accepte des paramètres absents',async()=>{
  http.get.mockResolvedValue({data:[]}); await getTarifs();
  expect(http.get).toHaveBeenCalledWith('/tarifs/calcul',{params:{chambre_id:undefined,arrivee:undefined,depart:undefined}});
 });
 it.each([
  [{response:{data:{error:'Tarif introuvable'},status:404}},'Tarif introuvable'],
  [{response:{status:403,data:{}}},'Erreur 403'],
  [{response:{status:500}},'Erreur 500'],
  [new Error('Network Error'),'Le service Tarifs est injoignable (port 8004).'],
  [undefined,'Le service Tarifs est injoignable (port 8004).'],
 ])('formate les erreurs API (%#)',(error,message)=>expect(messageErreur(error)).toBe(message));
});
