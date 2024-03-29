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

import de.itc.onkostar.api.Disease;
import de.itc.onkostar.api.Procedure;
import de.itc.onkostar.api.analysis.AnalyzerRequirement;
import de.itc.onkostar.api.analysis.IProcedureAnalyzer;
import de.itc.onkostar.api.analysis.OnkostarPluginType;
import de.ukw.ccc.onkostar.atccodes.services.AgentCodeService;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Plugin implementation
 * Provides methods exposed to Onkostar
 *
 * @author Paul-Christian Volkmer
 * @since 0.1.0
 */
@Component
public class AtcCodesPlugin implements IProcedureAnalyzer {

    private final List<AgentCodeService> agentCodeServices;

    public AtcCodesPlugin(List<AgentCodeService> agentCodeServices) {
        this.agentCodeServices = agentCodeServices;
    }

    @Override
    public OnkostarPluginType getType() {
        return OnkostarPluginType.BACKEND_SERVICE;
    }

    @Override
    public String getVersion() {
        return "0.5.0";
    }

    @Override
    public String getName() {
        return "ATC-Codes und Substanzen";
    }

    @Override
    public String getDescription() {
        return "ATC-Codes und Substanzen";
    }

    @Override
    public boolean isSynchronous() {
        return false;
    }

    @Override
    public AnalyzerRequirement getRequirement() {
        return AnalyzerRequirement.PROCEDURE;
    }

    @Override
    public boolean isRelevantForDeletedProcedure() {
        return false;
    }

    @Override
    public boolean isRelevantForAnalyzer(final Procedure procedure, final Disease disease) {
        return false;
    }

    @Override
    public void analyze(final Procedure procedure, final Disease disease) {
        // Nothing to do - should never be called
    }

    /**
     * Return list with ATC codes and agents.
     * Usage in script:
     *
     * <pre>
     *      executePluginMethod(
     *          'AtcCodesPlugin',
     *          'query',
     *          { q: '', size: 10 },
     *          function (result) {console.log(result);},
     *          false
     *      );
     * </pre>
     *
     * @param input The data Map
     * @return The result list filtered by input
     */
    public List<AgentCode> query(final Map<String, Object> input) {
        String query = "";
        if (null != input.get("q")) {
            query = input.get("q").toString();
        }

        int size = Integer.parseInt(input.get("size").toString());
        if (size == 0) {
            size = 10;
        }
        var result = new ArrayList<AgentCode>();
        for (var agentCodeService : this.agentCodeServices) {
            result.addAll(agentCodeService.findAgentCodes(query, size));
        }
        return result.stream().distinct().sorted().collect(Collectors.toList());
    }
}
