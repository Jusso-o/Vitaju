package br.com.vitaju.api.session;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:vitaju;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class ExerciseSessionControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsAndReadsSessionWithoutMedia() throws Exception {
        String request = """
                {
                  "exerciseId": "bracos",
                  "exerciseName": "Mobilidade dos braços",
                  "movementCount": 3,
                  "detectedFrames": 84,
                  "durationSeconds": 90,
                  "startedAt": "%s"
                }
                """.formatted(Instant.now());

        String location = mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.exerciseId", is("bracos")))
                .andExpect(jsonPath("$.movementCount", is(3)))
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(get(URI.create(location).getPath()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.detectedFrames", is(84)))
                .andExpect(jsonPath("$.durationSeconds", is(90)));
    }

    @Test
    void rejectsNegativeMovementCount() throws Exception {
        String startedAt = Instant.now().toString();
        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "exerciseId": "bracos",
                                  "exerciseName": "Mobilidade dos braços",
                                  "movementCount": -1,
                                  "detectedFrames": 0,
                                  "durationSeconds": 10,
                                  "startedAt": "%s"
                                }
                                """.formatted(startedAt)))
                .andExpect(status().isBadRequest());
    }
}
