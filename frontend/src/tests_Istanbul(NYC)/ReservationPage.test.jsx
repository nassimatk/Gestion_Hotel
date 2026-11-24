import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
import Page from '../pages/client/ReservationPage';
import { getChambres } from '../services/chambresApi';
import { getDisponibilites } from '../services/disponibilitesApi';
vi.mock('../services/chambresApi',()=>({getChambres:vi.fn(),getChambre:vi.fn()}));
vi.mock('../services/disponibilitesApi',()=>({getDisponibilites:vi.fn(),verifierChambre:vi.fn(),creerReservation:vi.fn()}));
vi.mock('../services/tarifsApi',()=>({getTarifs:vi.fn()}));
import { useAuth } from '../context/AuthContext';
import { verifierChambre, creerReservation } from '../services/disponibilitesApi';
import { getTarifs } from '../services/tarifsApi';
vi.mock('../context/AuthContext',()=>({useAuth:vi.fn()}));
const room={id:1,nom:'Suite Atlas',numero:'101',capacite:4,prix_nuit:1000};
const setup=()=>render(<MemoryRouter initialEntries={['/reservation']}><Page/></MemoryRouter>);
const search=()=>fireEvent.submit(document.querySelector('form'));
beforeEach(()=>{vi.resetAllMocks();useAuth.mockReturnValue({user:null,isAuthenticated:false});getChambres.mockResolvedValue([room]);getDisponibilites.mockResolvedValue({data:{chambres_occupees:[]}});});
describe('ReservationPage',()=>{
 it('affiche le formulaire de recherche',()=>{setup();expect(screen.getByRole('heading',{name:'Réservez votre séjour'})).toBeTruthy();});
 it('cherche les chambres libres',async()=>{setup();search();expect(await screen.findByRole('heading',{name:'1 chambre disponible'})).toBeTruthy();expect(getDisponibilites).toHaveBeenCalled();});
 it('exclut les chambres occupées',async()=>{getDisponibilites.mockResolvedValue({data:{chambres_occupees:[1]}});setup();search();expect(await screen.findByText('Aucune chambre disponible sur ces dates')).toBeTruthy();});
 it('exclut les chambres de capacité insuffisante',async()=>{getChambres.mockResolvedValue([{...room,capacite:1}]);setup();search();expect(await screen.findByText('Aucune chambre disponible sur ces dates')).toBeTruthy();});
});

describe('ReservationPage - finalisation',()=>{
 beforeEach(()=>{getTarifs.mockResolvedValue({total:900,sous_total:1000,promotion_appliquee:'Promo Atlas'});verifierChambre.mockResolvedValue({data:{disponible:true}});creerReservation.mockResolvedValue({data:{id:42}});});
 const checkout=async(auth=true)=>{useAuth.mockReturnValue({isAuthenticated:auth,user:auth?{name:'Client Test',email:'client@example.test'}:null});setup();search();fireEvent.click(await screen.findByRole('button',{name:'Sélectionner'}));await screen.findByRole('heading',{name:'Finaliser votre réservation'});await waitFor(()=>expect(getTarifs).toHaveBeenCalled());if(auth)await waitFor(()=>expect(document.querySelector('.res-submit-btn').disabled).toBe(false));};
 const submit=()=>fireEvent.submit(document.querySelector('.res-checkout__form'));
 const phone=()=>fireEvent.change(screen.getByPlaceholderText('Ex : 06 12 34 56 78'),{target:{value:'0612345678'}});
 it('bloque un visiteur non connecté',async()=>{await checkout(false);expect(document.querySelector('.res-submit-btn').disabled).toBe(true);submit();expect(await screen.findByText(/Vous devez être connecté pour confirmer/)).toBeTruthy();expect(creerReservation).not.toHaveBeenCalled();});
 it('exige le téléphone',async()=>{await checkout();submit();expect(await screen.findByText(/Veuillez saisir votre numéro de téléphone/)).toBeTruthy();expect(creerReservation).not.toHaveBeenCalled();});
 it('confirme la réservation avec les données attendues',async()=>{await checkout();phone();submit();expect(await screen.findByText('Réservation confirmée')).toBeTruthy();expect(creerReservation).toHaveBeenCalledWith(expect.objectContaining({chambre_id:1,telephone:'0612345678',nombre_personnes:expect.any(Number)}));});
 it('bloque une chambre devenue indisponible',async()=>{verifierChambre.mockResolvedValue({data:{disponible:false}});await checkout();phone();submit();expect(await screen.findByText(/cette chambre vient d'être réservée/)).toBeTruthy();expect(creerReservation).not.toHaveBeenCalled();});
 it('revient à la liste de chambres',async()=>{await checkout();fireEvent.click(screen.getByRole('button',{name:'Chambres disponibles'}));expect(await screen.findByRole('button',{name:'Sélectionner'})).toBeTruthy();});
 it('refuse les dates identiques dans la recherche',async()=>{setup();const [a,b]=document.querySelectorAll('input[type=date]');fireEvent.change(b,{target:{value:a.value}});search();expect(await screen.findByText(/date de départ doit être après/)).toBeTruthy();expect(getDisponibilites).not.toHaveBeenCalled();});
});
