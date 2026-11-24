import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
import Page from '../pages/client/ChambresPage';
import axios from 'axios';
import { getChambres } from '../services/chambresApi';
vi.mock('axios',()=>({default:{get:vi.fn()}}));
vi.mock('../services/chambresApi',()=>({getChambres:vi.fn()}));
const room={id:1,numero:'101',nom:'Suite Atlas',type:'suite',statut:'disponible',prix_nuit:1000,capacite:2,images:[]};
beforeEach(()=>{vi.resetAllMocks();axios.get.mockResolvedValue({data:[]});getChambres.mockResolvedValue([room]);vi.spyOn(window,'scrollTo').mockImplementation(()=>{});});
const setup=()=>render(<MemoryRouter><Page/></MemoryRouter>);
describe('ChambresPage',()=>{
 it('affiche les chambres disponibles',async()=>{setup();expect(await screen.findByRole('heading',{name:/Suite Atlas/})).toBeTruthy();expect(getChambres).toHaveBeenCalledWith({statut:'disponible'});});
 it('exclut les chambres occupées',async()=>{getChambres.mockResolvedValue([room,{...room,id:2,nom:'Chambre occupée test',statut:'occupee'}]);setup();await screen.findByRole('heading',{name:/Suite Atlas/});expect(screen.queryByText(/Chambre occupée test/)).toBeNull();});
 it('filtre les types',async()=>{setup();await screen.findByRole('heading',{name:/Suite Atlas/});fireEvent.click(screen.getByRole('button',{name:'Chambres Simples'}));expect(await screen.findByText(/Aucune chambre disponible dans cette sélection/)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Suites & Prestige'}));expect(await screen.findByRole('heading',{name:/Suite Atlas/})).toBeTruthy();});
 it('affiche une erreur et permet de réessayer',async()=>{getChambres.mockRejectedValueOnce(new Error('API chambres KO'));setup();await screen.findByText(/API chambres KO/);fireEvent.click(screen.getByRole('button',{name:'Réessayer'}));expect(await screen.findByRole('heading',{name:/Suite Atlas/})).toBeTruthy();});
});

describe('ChambresPage - galerie et détails',()=>{
 const images=['https://example.test/a.jpg','https://example.test/b.jpg'];
 const ready=async()=>{getChambres.mockResolvedValue([{...room,images,equipements:['Wi-Fi','TV'],description:'Description Atlas'}]);setup();await screen.findByRole('heading',{name:/Suite Atlas/});};
 it('ouvre et ferme la fiche',async()=>{await ready();fireEvent.click(screen.getByRole('button',{name:'Voir les détails'}));expect(screen.getByRole('heading',{level:2,name:/Suite Atlas/})).toBeTruthy();expect(screen.getByText('Équipements inclus :')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Fermer'}));expect(document.querySelector('.room-detail-modal-box')).toBeNull();});
 it('parcourt les photos de la carte',async()=>{await ready();const img=()=>document.querySelector('.room-card__image img');expect(img().src).toBe(images[0]);fireEvent.click(screen.getByRole('button',{name:'Photo suivante'}));expect(img().src).toBe(images[1]);fireEvent.click(screen.getByRole('button',{name:'Photo précédente'}));expect(img().src).toBe(images[0]);fireEvent.error(img());expect(img().src).not.toBe(images[0]);});
 it('parcourt les photos de la modale',async()=>{await ready();fireEvent.click(screen.getByRole('button',{name:'Voir les détails'}));const modal=document.querySelector('.room-detail-modal-box');const img=()=>modal.querySelector('.room-detail-image-wrapper img');fireEvent.click(modal.querySelector('[aria-label="Photo suivante"]'));expect(img().src).toBe(images[1]);fireEvent.click(modal.querySelector('[aria-label="Photo précédente"]'));expect(img().src).toBe(images[0]);fireEvent.click(modal.querySelector('[aria-label="Photo 2"]'));expect(img().src).toBe(images[1]);fireEvent.click(document.querySelector('.room-detail-modal-overlay'));expect(document.querySelector('.room-detail-modal-box')).toBeNull();});
 it('affiche un catalogue vide',async()=>{getChambres.mockResolvedValue([]);setup();expect(await screen.findByText(/Aucune chambre disponible dans cette sélection/)).toBeTruthy();});
});
