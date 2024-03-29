/*
 * MIT License
 *
 * Copyright (c) 2023 Comprehensive Cancer Center Mainfranken
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package de.ukw.ccc.onkostar.atccodes.services;

import de.ukw.ccc.onkostar.atccodes.AtcCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.ResourceLoader;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

@ExtendWith(MockitoExtension.class)
class CsvAtcCodeServiceTest {

    @Mock
    private ResourceLoader resourceLoader;

    private CsvAtcCodeService service;

    @BeforeEach
    void setup() {
        doAnswer(invocationOnMock -> new ClassPathResource("atc.csv")).when(resourceLoader).getResource(anyString());
        this.service = new CsvAtcCodeService(resourceLoader);
    }

    @Test
    void testShouldLoadAllAtcCodes() {
        var actual = service.findAgentCodes("", 0);

        assertThat(actual).hasSize(10);
    }

    @Test
    void testShouldLoadLimitedAtcCodes() {
        var actual = service.findAgentCodes("", 5);

        assertThat(actual).hasSize(5);
    }

    private static List<Arguments> expectedAgentCodes() {
        return List.of(
                Arguments.of(
                        "A01AA01", List.of(new AtcCode("A01AA01", "Sodium fluoride"))
                ),
                Arguments.of(
                        "Olaf", List.of(new AtcCode("A01AA03", "Olaflur"))
                ),
                Arguments.of(
                        "flur", List.of(new AtcCode("A01AA03", "Olaflur"))
                )
        );
    }

    @ParameterizedTest
    @MethodSource("expectedAgentCodes")
    void testShouldLoadFilteredAtcCodes(String query, List<AtcCode> expectedResults) {
        var actual = service.findAgentCodes(query, 0);

        assertThat(actual).hasSize(expectedResults.size());

        for (var i = 0; i < actual.size(); i++) {
            assertThat(actual.get(i).getCode()).isEqualTo(expectedResults.get(i).getCode());
            assertThat(actual.get(i).getName()).isEqualTo(expectedResults.get(i).getName());
            assertThat(actual.get(i).getVersion()).isNull();
        }
    }

    @Test
    void testShouldReturnAtcCodeWithAdditionalVersion() throws Exception {
        doAnswer(invocationOnMock -> new ClassPathResource("atc_with_version.csv")).when(resourceLoader).getResource(anyString());
        this.service = new CsvAtcCodeService(resourceLoader);

        var actual = service.findAgentCodes("A01AA01", 0);

        assertThat(actual).hasSize(1);
        assertThat(actual.get(0).getCode()).isEqualTo("A01AA01");
        assertThat(actual.get(0).getName()).isEqualTo("Sodium fluoride");
        assertThat(actual.get(0).getVersion()).isEqualTo("2023");
    }

    @Test
    void testShouldReturnEmptyListIfCsvFileNotFound() {
        doAnswer(invocationOnMock -> new ClassPathResource("nonexistant.csv")).when(resourceLoader).getResource(anyString());
        this.service = new CsvAtcCodeService(resourceLoader);

        var actual = service.findAgentCodes("A01AA01", 0);

        assertThat(actual).isEmpty();
    }

    @Test
    void testShouldReturnEmptyListIfCsvFileMissesColumn() {
        doAnswer(invocationOnMock -> new ClassPathResource("atc_missing_column.csv")).when(resourceLoader).getResource(anyString());
        this.service = new CsvAtcCodeService(resourceLoader);

        var actual = service.findAgentCodes("A01AA01", 0);

        assertThat(actual).isEmpty();
    }

}
