import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
import Page from '../pages/client/TarifsPage';
const setup=()=>render(<Page saisons={[{id:1,nom:'Haute saison',coefficient:1.5}]} promotions={[{id:2,nom:'Promo',pourcentage:20}]}/>);
const search=(v)=>fireEvent.change(screen.getByPlaceholderText('Entrez votre numéro de chambre'),{target:{value:v}});
beforeEach(()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({data:[{numero:'101',nom:'Suite Atlas',prix_nuit:1000}]})}));});
describe('TarifsPage',()=>{
 it('ne charge rien sans numéro',()=>{setup();expect(fetch).not.toHaveBeenCalled();});
 it('charge le tarif de base',async()=>{setup();search('101');expect(await screen.findByText('Suite Atlas')).toBeTruthy();expect(screen.getByText('1000.00 MAD / nuit')).toBeTruthy();});
 it('calcule saison, promotion et durée',async()=>{setup();search('101');await screen.findByText('Suite Atlas');fireEvent.change(screen.getByRole('spinbutton'),{target:{value:'3'}});const [s,p]=screen.getAllByRole('combobox');fireEvent.change(s,{target:{value:'1'}});fireEvent.change(p,{target:{value:'2'}});expect(screen.getByText('3600.00 MAD')).toBeTruthy();});
 it('gère une chambre inconnue',async()=>{setup();search('999');expect(await screen.findByText(/introuvable/)).toBeTruthy();});
 it('gère le service indisponible',async()=>{fetch.mockResolvedValue({ok:false});setup();search('101');expect(await screen.findByText('Service Chambres indisponible.')).toBeTruthy();});
});
