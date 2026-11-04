package com.hotel.disponibilites.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;

@Component
public class TarifsClient {

    private final RestClient restClient;
    private final boolean mock;

    public TarifsClient(@Value("${tarifs.service.url}") String baseUrl,
                        @Value("${tarifs.mock}") boolean mock) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.mock = mock;
    }

    public Double obtenirPrix(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        if (mock) {
            return 500.0; // Prix fictif quand le service du collègue n'est pas lancé
        }
        try {
            // Note : L'URL exacte "/tarifs/calcul" dépendra de ce que votre collègue a défini
            // dans docs/api-contracts/tarifs-service.yaml
            TarifDto response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tarifs/calcul")
                            .queryParam("chambre_id", chambreId)
                            .queryParam("date_debut", dateDebut)
                            .queryParam("date_fin", dateFin)
                            .build())
                    .retrieve()
                    .body(TarifDto.class);
            return response != null ? response.prix() : null;
        } catch (RestClientException e) {
            // Si le service Tarif est en panne, on renvoie null (le contrat l'autorise)
            return null;
        }
    }

    // Petit record interne pour désérialiser la réponse JSON du collègue
    private record TarifDto(Double prix) {}
}