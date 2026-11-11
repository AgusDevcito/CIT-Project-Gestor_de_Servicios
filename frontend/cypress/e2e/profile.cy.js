describe('Perfil End-to-End', () => {
  it('debe iniciar sesión y actualizar el perfil', () => {
    // Visit login page
    cy.visit('/login');
    // Fill credentials (assuming test user exists)
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    // After login, go to profile page
    cy.visit('/perfil');
    // Ensure profile data loads
    cy.contains('Mi Perfil');
    // Click edit button
    cy.contains('Editar datos personales').click();
    // Change first name
    cy.get('input[name="first_name"]').clear().type('NuevoNombre');
    // Submit form
    cy.contains('Guardar cambios').click();
    // Verify feedback message
    cy.contains('Perfil actualizado correctamente.');
  });
});
