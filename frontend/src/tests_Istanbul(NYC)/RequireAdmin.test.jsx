import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import RequireAdmin from '../components/RequireAdmin';
import { useAuth } from '../context/AuthContext';
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
function LoginProbe(){ const loc = useLocation(); return <div>Connexion cible : {loc.state?.from?.pathname}{loc.state?.from?.search}</div>; }
function start(auth){
  useAuth.mockReturnValue({loading:false,isAuthenticated:false,user:null,...auth});
  return render(<MemoryRouter initialEntries={['/admin/chambres?tab=all']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path='/admin/*' element={<RequireAdmin><div>Contenu protégé</div></RequireAdmin>}/><Route path='/login' element={<LoginProbe/>}/></Routes></MemoryRouter>);
}
afterEach(cleanup);
describe('RequireAdmin',()=>{
  it('affiche le chargement avant toute décision',()=>{
    start({loading:true});
    expect(screen.getByText(/Vérification des autorisations/)).toBeTruthy();
    expect(screen.queryByText('Contenu protégé')).toBeNull();
    expect(screen.queryByText(/Connexion cible/)).toBeNull();
  });
  it('redirige le visiteur vers login en conservant la destination',async()=>{
    start({});
    expect(await screen.findByText('Connexion cible : /admin/chambres?tab=all')).toBeTruthy();
    expect(screen.queryByText('Contenu protégé')).toBeNull();
  });
  it('refuse un client connecté et propose les liens de sortie',()=>{
    start({isAuthenticated:true,user:{name:'Ahmed Test',role:'client'}});
    expect(screen.getByRole('heading',{name:'Accès refusé'})).toBeTruthy();
    expect(screen.getByText('Ahmed Test')).toBeTruthy();
    expect(screen.getByText('client',{exact:true})).toBeTruthy();
    expect(screen.getByRole('link',{name:/Retour à l'accueil/}).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link',{name:/Se connecter en tant qu'admin/}).getAttribute('href')).toBe('/login');
    expect(screen.queryByText('Contenu protégé')).toBeNull();
  });
  it.each(['admin',{name:'admin'}])('autorise le rôle %j',role=>{
    start({isAuthenticated:true,user:{name:'Sara',role}});
    expect(screen.getByText('Contenu protégé')).toBeTruthy();
    expect(screen.queryByRole('heading',{name:'Accès refusé'})).toBeNull();
  });
  it('refuse un profil sans rôle',()=>{
    start({isAuthenticated:true,user:{name:'Sara'}});
    expect(screen.getByRole('heading',{name:'Accès refusé'})).toBeTruthy();
    expect(screen.getByText('client',{exact:true})).toBeTruthy();
  });
  it('refuse un profil absent malgré un indicateur authentifié',()=>{
    start({isAuthenticated:true,user:null});
    expect(screen.getByRole('heading',{name:'Accès refusé'})).toBeTruthy();
  });
  it('ne permet pas un accès sur le seul rôle si la session est absente',async()=>{
    start({isAuthenticated:false,user:{role:'admin'}});
    expect(await screen.findByText(/Connexion cible/)).toBeTruthy();
    expect(screen.queryByText('Contenu protégé')).toBeNull();
  });
});
