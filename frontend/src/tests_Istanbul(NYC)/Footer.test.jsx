import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import Footer from '../components/Footer';
afterEach(cleanup);
describe('Footer',()=>{
  it('affiche la marque et les mentions de copyright',()=>{
    render(<Footer/>);
    const footer=screen.getByRole('contentinfo');
    expect(within(footer).getByText(/Tous droits réservés/)).toBeTruthy();
    expect(within(footer).getByText(/La référence pour la réservation/)).toBeTruthy();
  });
  it('affiche les quatre liens de navigation',()=>{
    render(<Footer/>);
    for(const [name,href] of [['Accueil','/'],['Chambres & Suites','/chambres'],['À propos du Groupe','/apropos'],['Contact & Presse','/contact']]) expect(screen.getByRole('link',{name}).getAttribute('href')).toBe(href);
  });
  it('affiche les services et les liens légaux actuellement provisoires',()=>{
    render(<Footer/>);
    for(const name of ['Conciergerie VIP','Assistance 24/7','Transferts Aéroports Privés','Programme Membre Privilège','Mentions Légales','Confidentialité','Conditions Générales','Presse']) expect(screen.getByRole('link',{name,exact:true}).getAttribute('href')).toBe('#');
    expect(screen.getAllByRole('link')).toHaveLength(12);
  });
  it('affiche les deux boutons accessibles',()=>{
    render(<Footer/>);
    expect(screen.getByRole('button',{name:'Partager'})).toBeTruthy();
    expect(screen.getByRole('button',{name:'Nous contacter'})).toBeTruthy();
  });
  it('affiche les quatre villes et trois séparateurs',()=>{
    const {container}=render(<Footer/>);
    const cities=Array.from(container.querySelectorAll('.footer__city'));
    expect(cities.map(c=>c.textContent.replace('·','').trim())).toEqual(['Paris','Monaco','Genève','Dubaï']);
    expect(container.querySelectorAll('.footer__city > span')).toHaveLength(3);
  });
});
