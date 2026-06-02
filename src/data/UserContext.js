import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Función para iniciar sesión con el perfil simulado
  const login = (usuario) => {
    // 'usuario' será un objeto como: { nombre: "Ana Torres", rol: "Solicitante", bodega: "Bodega Norte" }
    setUsuarioActual(usuario);
  };

  // Función para cerrar sesión y volver a la landing
  const logout = () => {
    setUsuarioActual(null);
  };

  return (
    <UserContext.Provider value={{ usuarioActual, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);