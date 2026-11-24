import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import AdminAvisPage from '../pages/admin/avis/AdminAvisPage';
import { getAllAvis, deleteAvis } from '../services/avisApi';
vi.mock('../services/avisApi', () => ({ getAllAvis: vi.fn(), deleteAvis: vi.fn() }));
const avis = [
 {id:1,user_id:7,user:{name:'Ahmed Test',email:'ahmed@test.com'},chambre:{id:10,numero:'201',nom:'Suite Atlas',type:'suite'},note:5,commentaire:'Excellent séjour',created_at:'2026-11-20'},
 {id:2,user_id:8,user:{name:'Sara Test',email:'sara@test.com'},chambre:{id:11,numero:'202',nom:'Chambre Océan',type:'double'},note:3,commentaire:'Séjour correct',statut:'Masqué'}
];
const start = async () => { render(<AdminAvisPage/>); await screen.findByText('Ahmed Test'); };
const button = name => screen.getByRole('button',{name});
const row = name => screen.getByText(name).closest('tr');
const search = value => fireEvent.change(screen.getByPlaceholderText('Rechercher par client ou chambre...'),{target:{value}});
beforeEach(()=>{vi.resetAllMocks();getAllAvis.mockResolvedValue(avis);deleteAvis.mockResolvedValue(null);vi.spyOn(window,'confirm').mockReturnValue(true);});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('AdminAvisPage',()=>{
 it('affiche le titre et les avis',async()=>{await start();expect(screen.getByRole('heading',{name:'Gestion des avis'})).toBeTruthy();expect(screen.getByText('Sara Test')).toBeTruthy();expect(screen.getByText('ahmed@test.com')).toBeTruthy();expect(getAllAvis).toHaveBeenCalledTimes(1);});
 it.each([{data:avis},{data:{data:avis}},{avis}])('accepte une réponse enveloppée %#',async response=>{getAllAvis.mockResolvedValue(response);await start();});
 it('affiche le chargement',()=>{getAllAvis.mockReturnValue(new Promise(()=>{}));render(<AdminAvisPage/>);expect(screen.getByText('Chargement des avis...')).toBeTruthy();expect(button('Actualiser').disabled).toBe(true);});
 it.each([[],{},null])('affiche une liste vide %#',async response=>{getAllAvis.mockResolvedValue(response);render(<AdminAvisPage/>);await screen.findByText('Aucun avis trouvé');expect(button('Exporter CSV').disabled).toBe(true);});
 it('calcule les statistiques',async()=>{await start();const stat = label=>screen.getByText(label).closest('article').querySelector('.admin-stat-value').textContent;expect(stat('TOTAL DES AVIS')).toBe('2');expect(stat('NOTE MOYENNE')).toBe('4.0/5');expect(stat('AVIS PUBLIÉS')).toBe('1');});
 it.each([' AHMED ','ahmed@test.com','201','Suite Atlas','suite'])('recherche par %s',async value=>{await start();search(value);expect(screen.getByText('Ahmed Test')).toBeTruthy();expect(screen.queryByText('Sara Test')).toBeNull();});
 it('filtre les notes et revient à toutes les notes',async()=>{await start();const select=screen.getByLabelText('Filtrer par note');fireEvent.change(select,{target:{value:'3'}});expect(screen.queryByText('Ahmed Test')).toBeNull();expect(screen.getByText('Sara Test')).toBeTruthy();fireEvent.change(select,{target:{value:'Toutes les notes'}});expect(screen.getByText('Ahmed Test')).toBeTruthy();});
 it('gère une recherche sans résultat',async()=>{await start();search('inexistant');expect(screen.getByText('Aucun avis trouvé')).toBeTruthy();});
 it('affiche une erreur puis réessaie',async()=>{getAllAvis.mockRejectedValueOnce(new Error('Serveur indisponible'));render(<AdminAvisPage/>);expect((await screen.findByRole('alert')).textContent).toContain('Serveur indisponible');fireEvent.click(button('Réessayer'));await screen.findByText('Ahmed Test');});
 it('actualise les avis',async()=>{await start();getAllAvis.mockResolvedValue([avis[1]]);fireEvent.click(button('Actualiser'));await waitFor(()=>expect(screen.queryByText('Ahmed Test')).toBeNull());});
 it('ouvre et ferme les détails',async()=>{await start();fireEvent.click(within(row('Ahmed Test')).getByRole('button',{name:"Consulter l'avis"}));expect(screen.getByText("Détails de l'avis")).toBeTruthy();fireEvent.click(button('Fermer les détails'));expect(screen.queryByText("Détails de l'avis")).toBeNull();});
 it('ouvre les détails au clic sur une ligne',async()=>{await start();fireEvent.click(row('Ahmed Test'));expect(screen.getByText("Détails de l'avis")).toBeTruthy();});
 it('annule la suppression',async()=>{await start();window.confirm.mockReturnValue(false);fireEvent.click(within(row('Ahmed Test')).getByRole('button',{name:"Supprimer l'avis"}));expect(window.confirm).toHaveBeenCalled();expect(deleteAvis).not.toHaveBeenCalled();});
 it('supprime un avis et affiche une notification',async()=>{await start();fireEvent.click(within(row('Ahmed Test')).getByRole('button',{name:"Supprimer l'avis"}));await screen.findByText('Avis supprimé avec succès.');expect(deleteAvis).toHaveBeenCalledWith(1);expect(screen.queryByText('Ahmed Test')).toBeNull();fireEvent.click(button('Fermer'));expect(screen.queryByRole('status')).toBeNull();});
 it('conserve un avis si la suppression échoue',async()=>{await start();deleteAvis.mockRejectedValueOnce(new Error('Suppression impossible'));fireEvent.click(within(row('Ahmed Test')).getByRole('button',{name:"Supprimer l'avis"}));await screen.findByText('Suppression impossible');expect(screen.getByText('Ahmed Test')).toBeTruthy();});
 it('pagine et change la taille des pages',async()=>{getAllAvis.mockResolvedValue(Array.from({length:8},(_,i)=>({...avis[0],id:i+1,user:{name:`Client test ${i+1}`}})));render(<AdminAvisPage/>);await screen.findByText('Client test 1');expect(screen.queryByText('Client test 7')).toBeNull();fireEvent.click(button('Page suivante'));expect(screen.getByText('Client test 7')).toBeTruthy();expect(button('Page suivante').disabled).toBe(true);fireEvent.click(button('Page précédente'));expect(screen.getByText('Client test 1')).toBeTruthy();fireEvent.change(screen.getByLabelText("Nombre d'avis par page"),{target:{value:'10'}});expect(screen.getByText('Client test 8')).toBeTruthy();});
 it('exporte un fichier CSV',async()=>{await start();const create=vi.fn(()=> 'blob:test');const revoke=vi.fn();const OriginalURL=globalThis.URL;class MockURL extends OriginalURL {};MockURL.createObjectURL=create;MockURL.revokeObjectURL=revoke;vi.stubGlobal('URL',MockURL);let filename;vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(function(){filename=this.download;});fireEvent.click(button('Exporter CSV'));expect(create).toHaveBeenCalledWith(expect.any(Blob));expect(filename).toBe('hotelhub-gestion-avis.csv');expect(revoke).toHaveBeenCalledWith('blob:test');});
});
