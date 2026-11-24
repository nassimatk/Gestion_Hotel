import React from 'react';
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import AdminChamberPageEdit from '../pages/admin/chambres/AdminChamberPageEdit';
import {getChambre,updateChambre} from '../services/chambresApi';
vi.mock('../services/chambresApi',()=>({getChambre:vi.fn(),updateChambre:vi.fn()}));
const chambre={id:7,nom:'Suite Atlas',numero:'301',type:'suite',prix_nuit:1800,capacite:2,statut:'disponible',images:['https://example.test/a.jpg','https://example.test/b.jpg']};
const field=name=>document.querySelector(`[name="${name}"]`);
const change=(name,value)=>fireEvent.change(field(name),{target:{value}});
const start=async()=>{render(<MemoryRouter initialEntries={['/admin/chambres/7/edit']}><Routes><Route path='/admin/chambres/:id/edit' element={<AdminChamberPageEdit/>}/><Route path='/admin/chambres' element={<h1>Liste des chambres</h1>}/></Routes></MemoryRouter>);await waitFor(()=>expect(field('nom').value).toBe('Suite Atlas'));};
const submit=()=>fireEvent.submit(document.querySelector('form'));
beforeEach(()=>{vi.resetAllMocks();getChambre.mockResolvedValue(chambre);updateChambre.mockResolvedValue(chambre);vi.spyOn(window,'confirm').mockReturnValue(true);});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('AdminChamberPageEdit',()=>{
 it('charge les informations de la chambre',async()=>{await start();expect(getChambre).toHaveBeenCalledWith('7');expect(screen.getByText('CH-301')).toBeTruthy();expect(field('nom').value).toBe('Suite Atlas');expect(field('prixNuit').value).toBe('1800');});
 it('modifie les informations et redirige',async()=>{await start();change('nom','Suite rénovée');change('prixNuit','2000');change('statut','maintenance');submit();await screen.findByText(/Modifications enregistrées avec succès/);expect(updateChambre).toHaveBeenCalledWith('7',expect.objectContaining({nom:'Suite rénovée',prix_nuit:2000,statut:'maintenance',images:chambre.images}));await screen.findByText('Liste des chambres',{}, {timeout:3000});});
 it('gère une erreur de mise à jour',async()=>{await start();updateChambre.mockRejectedValueOnce(new Error('Modification impossible'));submit();await screen.findByText(/Modification impossible/);});
 it('désactive le bouton pendant la sauvegarde',async()=>{await start();updateChambre.mockReturnValue(new Promise(()=>{}));submit();expect(screen.getByRole('button',{name:'Enregistrement...'}).disabled).toBe(true);});
 it('annule la suppression de photo',async()=>{await start();window.confirm.mockReturnValue(false);fireEvent.click(screen.getByRole('button',{name:/Supprimer cette photo/}));expect(screen.getByText('Photographies de la chambre (2)')).toBeTruthy();});
 it('supprime une photo après confirmation',async()=>{await start();fireEvent.click(screen.getByRole('button',{name:/Supprimer cette photo/}));expect(screen.getByText('Photographies de la chambre (1)')).toBeTruthy();});
 it('ouvre la prévisualisation',async()=>{await start();const alert=vi.spyOn(window,'alert').mockImplementation(()=>{});fireEvent.click(screen.getByRole('button',{name:/Voir la fiche publique/}));expect(alert).toHaveBeenCalledWith('Prévisualisation de la fiche publique');});
 it('annule la modification',async()=>{await start();fireEvent.click(screen.getByRole('link',{name:/Annuler/}));await screen.findByText('Liste des chambres');expect(updateChambre).not.toHaveBeenCalled();});
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

describe('AdminChamberPageEdit — couverture avancée',()=>{
 it('ajoute et compresse une nouvelle photo HD',async()=>{const {drawImage,toDataURL}=mockCompression();await start();upload(photo());await screen.findByText('Photographies de la chambre (3)');expect(drawImage).toHaveBeenCalledWith(expect.anything(),0,0,1600,800);expect(toDataURL).toHaveBeenCalledWith('image/jpeg',0.82);});
 it('compresse sans redimensionner une petite image',async()=>{const {drawImage}=mockCompression({width:800,height:600});await start();upload(photo());await screen.findByText('Photographies de la chambre (3)');expect(drawImage).toHaveBeenCalledWith(expect.anything(),0,0,800,600);});
 it('ajoute plusieurs photos et modifie leur ordre',async()=>{mockCompression();await start();upload(photo('a.jpg'),photo('b.jpg'));await screen.findByText('Photographies de la chambre (4)');fireEvent.click(screen.getByAltText('Photo 2'));fireEvent.click(screen.getByRole('button',{name:/Définir comme photo principale/}));expect(document.querySelector('.photo-preview-large img').getAttribute('src')).toBe(chambre.images[1]);submit();await screen.findByText(/Modifications enregistrées avec succès/);expect(updateChambre).toHaveBeenCalledWith('7',expect.objectContaining({images:[chambre.images[1],chambre.images[0],compressed,compressed]}));});
 it('supprime la miniature sélectionnée',async()=>{await start();fireEvent.click(screen.getByAltText('Photo 2'));fireEvent.click(document.querySelectorAll('.edit-photo-thumb-del')[1]);expect(screen.getByText('Photographies de la chambre (1)')).toBeTruthy();expect(document.querySelector('.photo-preview-large img').getAttribute('src')).toBe(chambre.images[0]);});
 it('refuse les images de plus de 20 Mo',async()=>{await start();const alert=vi.spyOn(window,'alert').mockImplementation(()=>{});const file=photo();Object.defineProperty(file,'size',{value:21*1024*1024});upload(file);expect(alert).toHaveBeenCalledWith(expect.stringContaining('20 Mo'));expect(screen.getByText('Photographies de la chambre (2)')).toBeTruthy();});
 it('utilise le fichier brut si le décodage échoue',async()=>{mockCompression({imageError:true});await start();upload(photo());await screen.findByText('Photographies de la chambre (3)');expect(screen.getByAltText('Photo 3').getAttribute('src')).toBe('data:image/jpeg;base64,cmF3');});
 it('traite une erreur FileReader',async()=>{mockCompression({readerError:true});await start();upload(photo());await screen.findByText('Photographies de la chambre (3)');});
 it('traite les fichiers non image sans compression',async()=>{const {drawImage}=mockCompression();await start();upload(photo('a.txt','text/plain'));await screen.findByText('Photographies de la chambre (3)');expect(drawImage).not.toHaveBeenCalled();});
 it('traite une erreur de lecture non image',async()=>{mockCompression({readerError:true});await start();upload(photo('a.txt','text/plain'));await screen.findByText('Photographies de la chambre (3)');});
 it('ignore une sélection vide',async()=>{await start();upload();expect(screen.getByText('Photographies de la chambre (2)')).toBeTruthy();});
 it('utilise une photo de secours si aucune image API',async()=>{getChambre.mockResolvedValueOnce({...chambre,images:[]});await start();expect(screen.getByText('Photographies de la chambre (1)')).toBeTruthy();expect(screen.getByText('Photo par défaut')).toBeTruthy();});
 it('affiche le message générique si erreur sans message',async()=>{await start();updateChambre.mockRejectedValueOnce({});submit();await screen.findByText(/Erreur lors de la mise à jour de la chambre/);});
 it('transmet un tableau vide après suppression de toutes les photos',async()=>{await start();fireEvent.click(screen.getByRole('button',{name:/Supprimer cette photo/}));fireEvent.click(screen.getByRole('button',{name:/Supprimer cette photo/}));submit();await screen.findByText(/Modifications enregistrées avec succès/);expect(updateChambre).toHaveBeenCalledWith('7',expect.objectContaining({images:[]}));});
});
