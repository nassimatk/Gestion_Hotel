import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
import Page from '../pages/client/HomePage';
import axios from 'axios';
import { getChambres } from '../services/chambresApi';
vi.mock('axios',()=>({default:{get:vi.fn()}}));
vi.mock('../services/chambresApi',()=>({getChambres:vi.fn()}));
const room={id:1,numero:'101',nom:'Suite Atlas',type:'suite',statut:'disponible',prix_nuit:1000,capacite:2,images:[]};
beforeEach(()=>{vi.resetAllMocks();axios.get.mockResolvedValue({data:[]});getChambres.mockResolvedValue([room]);vi.spyOn(window,'scrollTo').mockImplementation(()=>{});});
import { useAuth } from '../context/AuthContext';
vi.mock('../context/AuthContext',()=>({useAuth:vi.fn()}));
vi.mock('../services/disponibilitesApi',()=>({verifierChambre:vi.fn()}));
const setup=()=>render(<MemoryRouter><Page/></MemoryRouter>);
describe('HomePage',()=>{
 it('affiche l’accueil et le catalogue',async()=>{useAuth.mockReturnValue({isAuthenticated:false});setup();expect(screen.getByRole('heading',{name:/Votre prochaine expérience/})).toBeTruthy();expect(await screen.findByRole('heading',{name:/Suite Atlas/})).toBeTruthy();});
 it('propose l’inscription aux visiteurs',async()=>{useAuth.mockReturnValue({isAuthenticated:false});setup();await waitFor(()=>expect(getChambres).toHaveBeenCalled());expect(screen.getAllByRole('link',{name:'Créer un compte'}).length).toBeGreaterThan(0);});
 it('masque le lien d’inscription principal pour un utilisateur connecté',async()=>{useAuth.mockReturnValue({isAuthenticated:true});setup();await screen.findByRole('heading',{name:/Suite Atlas/});expect(document.querySelector('.hero__cta a[href="/register"]')).toBeNull();});
 it('affiche une erreur de chargement',async()=>{useAuth.mockReturnValue({isAuthenticated:false});getChambres.mockRejectedValue(new Error('API chambres KO'));setup();expect(await screen.findByText(/API chambres KO/)).toBeTruthy();});
});

import { verifierChambre } from '../services/disponibilitesApi';
describe('HomePage - recherche avancée',()=>{
 beforeEach(()=>{useAuth.mockReturnValue({isAuthenticated:false});vi.stubGlobal('HTMLElement',window.HTMLElement);Object.defineProperty(HTMLElement.prototype,'scrollIntoView',{configurable:true,value:vi.fn()});verifierChambre.mockResolvedValue({data:{disponible:true}});});
 const ready=async()=>{setup();await screen.findByRole('heading',{name:/Suite Atlas/});};
 const form=()=>document.querySelector('form.search-bar');
 it('vérifie les disponibilités et réinitialise',async()=>{await ready();fireEvent.submit(form());await screen.findByText(/1 chambre\(s\) disponible/);expect(verifierChambre).toHaveBeenCalledWith(1,expect.objectContaining({adultes:expect.any(Number),date_debut:expect.any(String),date_fin:expect.any(String)}));fireEvent.click(screen.getByRole('button',{name:'Réinitialiser la recherche'}));expect(screen.queryByText(/1 chambre\(s\) disponible/)).toBeNull();});
 it('exclut une chambre indisponible',async()=>{verifierChambre.mockResolvedValue({data:{disponible:false}});await ready();fireEvent.submit(form());await screen.findByText(/0 chambre\(s\) disponible/);expect(screen.queryByRole('heading',{name:/Suite Atlas/})).toBeNull();});
 it('gère la panne du service disponibilités',async()=>{verifierChambre.mockRejectedValue(new Error('offline'));await ready();fireEvent.submit(form());expect(await screen.findByText(/Impossible de contacter le service Disponibilités/)).toBeTruthy();});
 it('refuse une arrivée passée',async()=>{await ready();fireEvent.change(form().querySelectorAll('input[type=date]')[0],{target:{value:'2000-01-01'}});fireEvent.submit(form());expect(await screen.findByText(/date d'arrivée ne peut pas être dans le passé/)).toBeTruthy();expect(verifierChambre).not.toHaveBeenCalled();});
 it('refuse un départ égal à l’arrivée',async()=>{await ready();const [a,b]=form().querySelectorAll('input[type=date]');fireEvent.change(b,{target:{value:a.value}});fireEvent.submit(form());expect(await screen.findByText(/date de départ doit être après/)).toBeTruthy();});
 it('filtre les suites et les doubles',async()=>{await ready();fireEvent.click(screen.getByRole('button',{name:'Chambres Doubles'}));expect(screen.queryByRole('heading',{name:/Suite Atlas/})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Suites'}));expect(screen.getByRole('heading',{name:/Suite Atlas/})).toBeTruthy();});
});
