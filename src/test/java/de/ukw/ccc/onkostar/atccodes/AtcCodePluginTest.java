/*
 * MIT License
 *
 * Copyright (c) 2022 Comprehensive Cancer Center Mainfranken
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

package de.ukw.ccc.onkostar.atccodes;

import de.ukw.ccc.onkostar.atccodes.services.CsvAtcCodeService;
import de.ukw.ccc.onkostar.atccodes.services.OnkostarAgentCodeService;
import de.ukw.ccc.onkostar.atccodes.services.WhoAtcCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AtcCodePluginTest {

    @Mock
    private OnkostarAgentCodeService onkostarAgentCodeService;

    @Mock
    private WhoAtcCodeService whoAtcCodeService;

    @Mock
    private CsvAtcCodeService csvAtcCodeService;

    private AtcCodesPlugin plugin;

    @BeforeEach
    void setup() {
        when(onkostarAgentCodeService.findAgentCodes(anyString(), anyInt())).thenReturn(
                List.of(new UnregisteredCode("Acetylsali", "Acetylsalicylsäure"))
        );

        when(whoAtcCodeService.findAgentCodes(anyString(), anyInt())).thenReturn(
                List.of(
                        new AtcCode("A01AD05", "Acetylsalicylic acid"),
                        new AtcCode("B01AC06", "Acetylsalicylic acid"),
                        new AtcCode("B01AC56", "Acetylsalicylic acid, combinations with proton pump inhibitors"),
                        new AtcCode("M01BA03", "Acetylsalicylic acid and corticosteroids")
                )
        );

        when(csvAtcCodeService.findAgentCodes(anyString(), anyInt())).thenReturn(
                List.of(
                        new AtcCode("M01BA03", "acetylsalicylic acid and corticosteroids")
                )
        );

        this.plugin = new AtcCodesPlugin(List.of(onkostarAgentCodeService, whoAtcCodeService, csvAtcCodeService));
    }

    @Test
    void testShouldReturnDistinctListWithAgentsFromAllSources() {
        var actual = plugin.query(Map.of("q", "Acetylsa", "size", 10));
        assertThat(actual).hasSize(5);
    }

    @Test
    void testShouldVerifyAllServicesAreUsed() {
        plugin.query(Map.of("q", "Acetylsa", "size", 10));

        verify(onkostarAgentCodeService, times(1)).findAgentCodes(anyString(), anyInt());
        verify(whoAtcCodeService, times(1)).findAgentCodes(anyString(), anyInt());
        verify(csvAtcCodeService, times(1)).findAgentCodes(anyString(), anyInt());
    }

    @Test
    void testShouldReturnListSortedByName() {
        var actual = plugin.query(Map.of("q", "Acetylsa", "size", 10));

        assertThat(actual).isEqualTo(
                List.of(
                        new AtcCode("A01AD05", "Acetylsalicylic acid"),
                        new AtcCode("B01AC06", "Acetylsalicylic acid"),
                        new AtcCode("M01BA03", "Acetylsalicylic acid and corticosteroids"),
                        new AtcCode("B01AC56", "Acetylsalicylic acid, combinations with proton pump inhibitors"),
                        new UnregisteredCode("Acetylsali", "Acetylsalicylsäure")
                )
        );
    }

}
