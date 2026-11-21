package com.moodboard.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moodboard.backend.modelo.javabean.User;
import com.moodboard.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

	@Autowired
    private UserRepository userRepository;
	
	// 1. REGISTRO: POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User nuevoUsuario) {
        if (userRepository.findByEmail(nuevoUsuario.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Ese email ya está registrado");
        }
        User guardado = userRepository.save(nuevoUsuario);
        return ResponseEntity.ok(guardado);
    }

    // 2. LOGIN: POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User datosLogin) {
        User usuario = userRepository.findByEmail(datosLogin.getEmail());
        if (usuario != null && usuario.getContrasena().equals(datosLogin.getContrasena())) {
            return ResponseEntity.ok(usuario);
        }
        return ResponseEntity.status(401).body("Email o contraseña incorrectos");
    }

    // 3. DEMO (Un clic para reclutadores): POST /api/auth/demo
    @PostMapping("/demo")
    public ResponseEntity<User> loginDemo() {
        User demo = userRepository.findByEmail("invitado@demo.com");
        if (demo == null) {
            demo = new User();
            demo.setUsername("Reclutador_Demo");
            demo.setEmail("invitado@demo.com");
            demo.setContrasena("1234");
            demo = userRepository.save(demo);
        }
        return ResponseEntity.ok(demo);
    }
}
