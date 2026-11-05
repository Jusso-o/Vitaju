package br.com.vitaju.api.session;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CreateExerciseSessionRequest(
        @NotBlank @Size(max = 40) String exerciseId,
        @NotBlank @Size(max = 120) String exerciseName,
        @Min(0) int movementCount,
        @Min(0) int detectedFrames,
        @Min(1) int durationSeconds,
        @NotNull @PastOrPresent Instant startedAt) {

    public ExerciseSession toEntity() {
        return new ExerciseSession(
                exerciseId,
                exerciseName,
                movementCount,
                detectedFrames,
                durationSeconds,
                startedAt);
    }
}
