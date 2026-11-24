import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import AdminChamberPageAdd from '../pages/admin/chambres/AdminChamberPageAdd';
import {createChambre} from '../services/chambresApi';
vi.mock('../services/chambresApi',()=>({createChambre:vi.fn()}));
const start=()=>render(<MemoryRouter initialEntries={['/admin/chambres/add']}><Routes><Route path='/admin/chambres/add' element={<AdminChamberPageAdd/>}/><Route path='/admin/chambres' element={<h1>Liste des chambres</h1>}/></Routes></MemoryRouter>);
const field=name=>document.querySelector(`[name="${name}"]`);
const change=(name,value)=>fireEvent.change(field(name),{target:{value}});
const submit=()=>fireEvent.submit(document.querySelector('form'));
beforeEach(()=>{vi.resetAllMocks();createChambre.mockResolvedValue({id:1});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('AdminChamberPageAdd',()=>{
 it('affiche les valeurs initiales',()=>{start();expect(screen.getByRole('heading',{name:'Ajouter une chambre'})).toBeTruthy();expect(field('nom').value).toBe('Suite Majestueuse Palmeraie');expect(field('numero').value).toBe('201');});
 it('crée la chambre et redirige',async()=>{start();change('nom','  Suite Atlas  ');change('numero','302');change('prixNuit','1500');submit();await screen.findByText('Liste des chambres');expect(createChambre).toHaveBeenCalledWith(expect.objectContaining({nom:'Suite Atlas',numero:'302',prix_nuit:1500,images:expect.any(Array)}));});
 it.each(['nom','numero','prixNuit'])('refuse un champ obligatoire vide : %s',async name=>{start();change(name,'');submit();await screen.findByText(/Veuillez renseigner tous les champs obligatoires/);expect(createChambre).not.toHaveBeenCalled();});
 it('transforme les équipements en tableau',async()=>{start();submit();await waitFor(()=>expect(createChambre).toHaveBeenCalledWith(expect.objectContaining({equipements:['Terrasse privée','Baignoire îlot','Marbre italien',"Boiseries d'ébène",'Wi-Fi VIP']})));});
 it('affiche une erreur API',async()=>{createChambre.mockRejectedValueOnce(new Error('Numéro déjà utilisé'));start();submit();await screen.findByText(/Numéro déjà utilisé/);});
 it('désactive la publication durant la sauvegarde',()=>{createChambre.mockReturnValue(new Promise(()=>{}));start();submit();expect(screen.getByRole('button',{name:'Enregistrement en cours...'}).disabled).toBe(true);});
 it('supprime la photo initiale',()=>{start();fireEvent.click(screen.getByTitle('Supprimer cette photo'));expect(screen.getByText('Aucune photo sélectionnée')).toBeTruthy();});
 it('refuse une image de plus de 20 Mo',()=>{start();const alert=vi.spyOn(window,'alert').mockImplementation(()=>{});const file=new File(['x'],'large.jpg',{type:'image/jpeg'});Object.defineProperty(file,'size',{value:21*1024*1024});fireEvent.change(document.querySelector('input[type=file]'),{target:{files:[file]}});expect(alert).toHaveBeenCalledWith(expect.stringContaining('20 Mo'));});
 it('annule et revient à la liste',async()=>{start();fireEvent.click(screen.getByRole('link',{name:'Annuler'}));await screen.findByText('Liste des chambres');expect(createChambre).not.toHaveBeenCalled();});
});

// Simule les API navigateur absentes de jsdom, sans réseau ni vrais fichiers.
function mockCompression({width=2400,height=1200,readerError=false,imageError=false}={}) {
 const drawImage=vi.fn();
 const toDataURL=vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/jpeg;base64,Y29tcHJlc3NlZA==');
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage});
 vi.stubGlobal('FileReader',class {
   readAsDataURL(file) {
     this.result='data:'+file.type+';base64,cmF3';
     if(readerError) this.onerror?.(new Error('Lecture impossible'));
     else this.onload?.({target:this});
   }
 });
 vi.stubGlobal('Image',class {
   constructor(){this.width=width;this.height=height;}
   set src(value){if(imageError)this.onerror?.();else this.onload?.();}
 });
 return {drawImage,toDataURL};
}
const upload=(...files)=>fireEvent.change(document.querySelector('input[type=file]'),{target:{files}});
const photo=(name='test.jpg',type='image/jpeg')=>new File(['image'],name,{type});
const compressed='data:image/jpeg;base64,Y29tcHJlc3NlZA==';

describe('AdminChamberPageAdd — couverture avancée',()=>{
 it('compresse et redimensionne une image HD',async()=>{const {drawImage,toDataURL}=mockCompression();start();upload(photo());await waitFor(()=>expect(document.querySelector('.photo-preview-img').getAttribute('src')).toBe(compressed));expect(drawImage).toHaveBeenCalledWith(expect.anything(),0,0,1600,800);expect(toDataURL).toHaveBeenCalledWith('image/jpeg',0.82);expect(screen.getByText('Photographies (1)')).toBeTruthy();});
 it('conserve les dimensions des petites images',async()=>{const {drawImage}=mockCompression({width:800,height:600});start();upload(photo());await waitFor(()=>expect(drawImage).toHaveBeenCalledWith(expect.anything(),0,0,800,600));});
 it('ajoute plusieurs photos et change la principale',async()=>{mockCompression();start();upload(photo('a.jpg'),photo('b.jpg'));await screen.findByText('Photographies (2)');fireEvent.click(document.querySelectorAll('.photo-thumb-item')[1]);expect(screen.getByText('Photo 2 (Galerie)')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Définir comme principale'}));expect(document.querySelector('.photo-preview-img').alt).toBe('b.jpg');});
 it('supprime une miniature secondaire sélectionnée',async()=>{mockCompression();start();upload(photo('a.jpg'),photo('b.jpg'));await screen.findByText('Photographies (2)');fireEvent.click(document.querySelectorAll('.photo-thumb-item')[1]);fireEvent.click(document.querySelectorAll('.photo-thumb-remove')[1]);expect(screen.getByText('Photographies (1)')).toBeTruthy();expect(document.querySelector('.photo-preview-img').alt).toBe('a.jpg');});
 it('utilise le fichier brut si le décodage échoue',async()=>{mockCompression({imageError:true});start();upload(photo());await waitFor(()=>expect(document.querySelector('.photo-preview-img').getAttribute('src')).toBe('data:image/jpeg;base64,cmF3'));});
 it('traite une erreur de lecture',async()=>{mockCompression({readerError:true});start();upload(photo('broken.jpg'));await waitFor(()=>expect(document.querySelector('.photo-preview-img').alt).toBe('broken.jpg'));});
 it('traite un fichier non image sans compression',async()=>{const {drawImage}=mockCompression();start();upload(photo('test.txt','text/plain'));await waitFor(()=>expect(document.querySelector('.photo-preview-img').alt).toBe('test.txt'));expect(drawImage).not.toHaveBeenCalled();});
 it('gère une erreur de lecture non image',async()=>{mockCompression({readerError:true});start();upload(photo('test.txt','text/plain'));await waitFor(()=>expect(document.querySelector('.photo-preview-img').alt).toBe('test.txt'));});
 it('ignore une sélection vide',()=>{const {drawImage}=mockCompression();start();upload();expect(drawImage).not.toHaveBeenCalled();expect(screen.getByText('Photographies (1)')).toBeTruthy();});
 it('envoie un tableau vide sans photo',async()=>{start();fireEvent.click(screen.getByTitle('Supprimer cette photo'));submit();await screen.findByText('Liste des chambres');expect(createChambre).toHaveBeenCalledWith(expect.objectContaining({images:[]}));});
 it('affiche le message générique si erreur sans message',async()=>{createChambre.mockRejectedValueOnce({});start();submit();await screen.findByText(/Erreur lors de l.enregistrement de la chambre/);});
 it('transmet les caractéristiques numériques modifiées',async()=>{start();change('etage','3');change('capacite','4');change('superficie','90');change('type','suite');submit();await screen.findByText('Liste des chambres');expect(createChambre).toHaveBeenCalledWith(expect.objectContaining({etage:3,capacite:4,superficie:90,type:'suite'}));});
});
