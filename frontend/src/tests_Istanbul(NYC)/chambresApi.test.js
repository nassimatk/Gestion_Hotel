import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {getChambres,getChambre,createChambre,updateChambre,deleteChambre} from '../services/chambresApi';
const base=import.meta.env.VITE_CHAMBRES_API_URL || 'http://localhost:8001/api/chambres';
const fetchMock=vi.fn();
const data={id:7,nom:'Suite Atlas'};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:vi.fn().mockResolvedValue(body)});
beforeEach(()=>{fetchMock.mockReset();vi.stubGlobal('fetch',fetchMock);localStorage.setItem('token','test-jwt');});
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
describe('chambresApi',()=>{
 it('récupère la liste enveloppée',async()=>{fetchMock.mockResolvedValue(response({data:[data]}));expect(await getChambres()).toEqual([data]);expect(fetchMock).toHaveBeenCalledWith(base,{headers:{'Content-Type':'application/json'}});});
 it('ajoute les paramètres de recherche',async()=>{fetchMock.mockResolvedValue(response([data]));expect(await getChambres({type:'suite'})).toEqual([data]);expect(fetchMock.mock.calls[0][0]).toBe(`${base}?type=suite`);});
 it('récupère le détail',async()=>{fetchMock.mockResolvedValue(response({data}));expect(await getChambre(7)).toEqual(data);expect(fetchMock.mock.calls[0][0]).toBe(`${base}/7`);});
 it.each([[createChambre,[data],'POST',''],[updateChambre,[7,data],'PUT','/7']])('envoie le JSON et le JWT %#',async(fn,args,method,path)=>{fetchMock.mockResolvedValue(response({data}));expect(await fn(...args)).toEqual(data);expect(fetchMock).toHaveBeenCalledWith(base+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer test-jwt'},body:JSON.stringify(data)});});
 it('supprime la chambre avec JWT',async()=>{fetchMock.mockResolvedValue(response(null,204));expect(await deleteChambre(7)).toBe(true);expect(fetchMock).toHaveBeenCalledWith(`${base}/7`,{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:'Bearer test-jwt'}});});
 it('omet Authorization sans token',async()=>{localStorage.removeItem('token');fetchMock.mockResolvedValue(response(data));await createChambre(data);expect(fetchMock.mock.calls[0][1].headers).toEqual({'Content-Type':'application/json'});});
 it.each([[getChambres,[]],[getChambre,[7]],[createChambre,[data]],[updateChambre,[7,data]],[deleteChambre,[7]]])('propage le message HTTP %#',async(fn,args)=>{fetchMock.mockResolvedValue(response({error:'Accès refusé'},403));await expect(fn(...args)).rejects.toThrow('Accès refusé');});
 it.each([[createChambre,[data]],[updateChambre,[7,data]]])('agrège les erreurs de validation %#',async(fn,args)=>{fetchMock.mockResolvedValue(response({errors:{nom:['Nom requis'],numero:['Numéro invalide']}},422));await expect(fn(...args)).rejects.toThrow('Nom requis Numéro invalide');});
 it.each([[getChambres,[],'Impossible de récupérer les chambres'],[getChambre,[7],'Chambre introuvable'],[createChambre,[data],'Échec de création'],[updateChambre,[7,data],'Échec de modification'],[deleteChambre,[7],'Échec de suppression']])('gère une réponse non JSON %#',async(fn,args,message)=>{fetchMock.mockResolvedValue({ok:false,status:500,json:vi.fn().mockRejectedValue(new Error('JSON invalide'))});await expect(fn(...args)).rejects.toThrow(message);});
});
