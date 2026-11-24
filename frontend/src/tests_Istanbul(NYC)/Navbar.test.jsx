import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
const logout = vi.fn();
const start = (auth = {}, path = '/') => {
  useAuth.mockReturnValue({ user: null, isAuthenticated: false, logout, ...auth });
  return render(<MemoryRouter initialEntries={[path]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Navbar /></MemoryRouter>);
};
const link = name => screen.getByRole('link', {name});
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
describe('Navbar', () => {
  it('affiche les liens publics', () => {
    start();
    for (const [name, href] of [['Accueil','/'],['Chambres','/chambres'],['Disponibilités','/reservation'],['À propos','/apropos'],['Contact','/contact'],['Connexion','/login'],['Inscription','/register']]) expect(link(name).getAttribute('href')).toBe(href);
    expect(screen.queryByRole('link',{name:'Dashboard'})).toBeNull();
    expect(screen.queryByRole('link',{name:'Mes réservations'})).toBeNull();
    expect(screen.queryByRole('button',{name:'Déconnexion'})).toBeNull();
  });
  it('marque uniquement la route active', () => {
    start({}, '/chambres');
    expect(link('Chambres').classList.contains('active')).toBe(true);
    expect(link('Accueil').classList.contains('active')).toBe(false);
  });
  it('affiche le logo et le bouton de langue', () => {
    start();
    expect(screen.getByRole('link',{name:/HotelHub/}).getAttribute('href')).toBe('/');
    expect(screen.getByRole('button',{name:'Changer de langue'})).toBeTruthy();
  });
  it('affiche les réservations et le prénom du client connecté', () => {
    start({isAuthenticated:true,user:{name:'Ahmed Test',role:'client'}});
    expect(link('Mes réservations').getAttribute('href')).toBe('/mes-reservations');
    expect(screen.getByText('Ahmed',{exact:true})).toBeTruthy();
    for(const name of ['Connexion','Inscription','Contact','À propos','Dashboard']) expect(screen.queryByRole('link',{name})).toBeNull();
  });
  it.each(['admin',{name:'admin'}])('reconnaît le rôle administrateur %j', role => {
    start({isAuthenticated:true,user:{name:'Sara Test',role}}, '/admin');
    expect(link('Dashboard').getAttribute('href')).toBe('/admin');
    expect(link('Dashboard').classList.contains('active')).toBe(true);
    expect(screen.getByText('Admin',{exact:true})).toBeTruthy();
  });
  it('appelle logout au clic', () => {
    start({isAuthenticated:true,user:{name:'Ahmed',role:'client'}});
    fireEvent.click(screen.getByRole('button',{name:'Déconnexion'}));
    expect(logout).toHaveBeenCalledTimes(1);
  });
  it('supporte un profil sans nom ni rôle', () => {
    start({isAuthenticated:true,user:{}});
    expect(screen.getByRole('button',{name:'Déconnexion'})).toBeTruthy();
    expect(screen.queryByRole('link',{name:'Dashboard'})).toBeNull();
  });
});
