package br.com.vitaju.api.session;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/sessions")
public class ExerciseSessionController {
    private final ExerciseSessionRepository repository;

    public ExerciseSessionController(ExerciseSessionRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<ExerciseSession> create(
            @Valid @RequestBody CreateExerciseSessionRequest request) {
        ExerciseSession saved = repository.save(request.toEntity());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping
    public List<ExerciseSession> listRecent() {
        return repository.findTop50ByOrderByStartedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseSession> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
