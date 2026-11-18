package com.hotel.disponibilites.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.LocalDate;

@Component
public class TarifsClient {

    private final RestClient restClient;
    private final boolean mock;

    public TarifsClient(@Value("${tarifs.service.url}") String baseUrl,
                        @Value("${tarifs.mock}") boolean mock) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
        this.mock = mock;
    }

    public Double obtenirPrix(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        if (mock) {
            return 500.0; // Prix fictif quand tarifs-service n'est pas lancé
        }
        try {
            TarifCalculResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tarifs/calcul")
                            .queryParam("chambre_id", chambreId)
                            .queryParam("arrivee", dateDebut)
                            .queryParam("depart", dateFin)
                            .build())
                    .retrieve()
                    .body(TarifCalculResponse.class);

            if (response != null && response.success() && response.data() != null) {
                return response.data().prixTotal();
            }
            return null;
        } catch (RestClientException e) {
            // Si tarifs-service est indisponible ou aucun tarif actif n'est trouvé, on renvoie null
            return null;
        }
    }

    private record TarifCalculResponse(
            boolean success,
            TarifData data
    ) {}

    private record TarifData(
            @JsonProperty("prix_total") Double prixTotal,
            @JsonProperty("sous_total") Double sousTotal,
            @JsonProperty("nb_nuits") Integer nbNuits,
            String devise
    ) {}
}