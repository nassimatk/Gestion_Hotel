import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
import Page from '../pages/client/DetailChambrePage';
import axios from 'axios';
import { getChambres } from '../services/chambresApi';
vi.mock('axios',()=>({default:{get:vi.fn()}}));
vi.mock('../services/chambresApi',()=>({getChambres:vi.fn()}));
const room={id:1,numero:'101',nom:'Suite Atlas',type:'suite',statut:'disponible',prix_nuit:1000,capacite:2,images:[]};
beforeEach(()=>{vi.resetAllMocks();axios.get.mockResolvedValue({data:[]});getChambres.mockResolvedValue([room]);vi.spyOn(window,'scrollTo').mockImplementation(()=>{});});
vi.mock('../context/AuthContext',()=>({useAuth:()=>({isAuthenticated:false})}));
vi.mock('../pages/client/ClientAvisPage',()=>({default:()=> <div>Avis simulés</div>}));
const setup=()=>render(<MemoryRouter initialEntries={['/chambres/1']}><Routes><Route path="/chambres/:id" element={<Page/>}/></Routes></MemoryRouter>);
describe('DetailChambrePage',()=>{
 it('affiche le chargement',()=>{getChambres.mockReturnValue(new Promise(()=>{}));setup();expect(screen.getByText('Chargement de la chambre...')).toBeTruthy();});
 it('charge les détails',async()=>{setup();expect(await screen.findByText('Équipements & prestations')).toBeTruthy();expect(getChambres).toHaveBeenCalled();});
 it('gère une chambre inexistante',async()=>{getChambres.mockResolvedValue([]);setup();expect(await screen.findByText('Chambre avec ID 1 introuvable.')).toBeTruthy();});
 it('gère une erreur API',async()=>{getChambres.mockRejectedValue(new Error('API KO'));setup();expect(await screen.findByText('API KO')).toBeTruthy();});
});

describe('DetailChambrePage - interactions',()=>{
 const ready=async()=>{getChambres.mockResolvedValue([{...room,images:['https://example.test/a.jpg','https://example.test/b.jpg'],equipements:['Wi-Fi','TV']}]);setup();await screen.findByText('Équipements & prestations');};
 it('ouvre la galerie plein écran et navigue',async()=>{await ready();fireEvent.click(screen.getByRole('button',{name:/Plein écran/}));expect(document.querySelector('.lightbox')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Image suivante'}));expect(document.querySelector('.lightbox-count').textContent.trim()).toMatch(/^2\s*\//);fireEvent.click(screen.getByRole('button',{name:'Image précédente'}));expect(document.querySelector('.lightbox-count').textContent.trim()).toMatch(/^1\s*\//);fireEvent.click(screen.getByRole('button',{name:'Fermer'}));expect(document.querySelector('.lightbox')).toBeNull();});
 it('ferme la galerie avec Escape',async()=>{await ready();fireEvent.click(document.querySelector('.gallery-item'));fireEvent.keyDown(window,{key:'Escape'});expect(document.querySelector('.lightbox')).toBeNull();});
 const dateLocale = (offset) => {
   const d = new Date();
   d.setDate(d.getDate() + offset);
   return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 };
 it('modifie les dates du séjour', async () => {
   await ready();
   const a = screen.getByLabelText('Arrivée');
   const b = screen.getByLabelText('Départ');
   expect(b.value).toBe('');
   fireEvent.change(a, { target: { value: dateLocale(10) } });
   expect(a.value).toBe(dateLocale(10));
   expect(b.value).toBe('');
   expect(b.min).toBe(dateLocale(11));
   fireEvent.change(b, { target: { value: dateLocale(12) } });
   expect(b.value).toBe(dateLocale(12));
   fireEvent.change(a, { target: { value: dateLocale(13) } });
   expect(a.value).toBe(dateLocale(13));
   expect(b.value).toBe(dateLocale(14));
   expect(b.min).toBe(dateLocale(14));
 });
});
