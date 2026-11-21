package com.moodboard.backend.controller;


import com.moodboard.backend.modelo.javabean.Moodboard;
import com.moodboard.backend.modelo.javabean.Track;
import com.moodboard.backend.modelo.javabean.User;
import com.moodboard.backend.repository.MoodboardRepository;
import com.moodboard.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/moodboards")
@CrossOrigin(origins = "*")
public class MoodboardController {

	@Autowired
    private MoodboardRepository moodboardRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. LISTAR CON FILTROS: GET /api/moodboards?tag=Melancólico o ?type=libro
    @GetMapping
    public List<Moodboard> listar(
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String type) {
        if (tag != null) {
            return moodboardRepository.findByTagsNombre(tag);
        }
        if (type != null) {
            return moodboardRepository.findByMediaType(type);
        }
        return moodboardRepository.findAll();
    }

    // 2. RULETA DE MOOD: GET /api/moodboards/random?tag=Acogedor
    @GetMapping("/random")
    public ResponseEntity<?> aleatorio(@RequestParam(required = false) String tag) {
        List<Moodboard> lista = (tag != null)
                ? moodboardRepository.findByTagsNombre(tag)
                : moodboardRepository.findAll();

        if (lista.isEmpty()) {
            return ResponseEntity.status(404).body("No hay moodboards para ese estado de ánimo");
        }
        Moodboard elegido = lista.get(new Random().nextInt(lista.size()));
        return ResponseEntity.ok(elegido);
    }

    // 3. CREAR MOODBOARD: POST /api/moodboards
    @PostMapping
    public Moodboard crear(@RequestBody Moodboard nuevoMoodboard) {
        if (nuevoMoodboard.getTracks() != null) {
            for (Track cancion : nuevoMoodboard.getTracks()) {
                cancion.setMoodboard(nuevoMoodboard);
            }
        }
        return moodboardRepository.save(nuevoMoodboard);
    }

    // 4. GUARDAR / QUITAR DE FAVORITOS: POST /api/moodboards/{id}/save?idUser=1
    @PostMapping("/{id}/save")
    public ResponseEntity<?> guardarFavorito(@PathVariable Integer id, @RequestParam Integer idUser) {
        Moodboard mb = moodboardRepository.findById(id).orElse(null);
        User user = userRepository.findById(idUser).orElse(null);

        if (mb == null || user == null) {
            return ResponseEntity.badRequest().body("Moodboard o usuario no encontrado");
        }

        if (mb.getSavedByUsers().contains(user)) {
            mb.getSavedByUsers().remove(user);
            moodboardRepository.save(mb);
            return ResponseEntity.ok("Eliminado de favoritos");
        } else {
            mb.getSavedByUsers().add(user);
            moodboardRepository.save(mb);
            return ResponseEntity.ok("Guardado en favoritos");
        }
    }
	
}
