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

package de.ukw.ccc.onkostar.atccodes.services;

import de.ukw.ccc.onkostar.atccodes.AgentCode;
import org.apache.commons.lang.SystemUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ResourceLoader;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Abstract {@link AgentCodeService} for use with files that will load information into memory
 *
 * @author Paul-Christian Volkmer
 * @since 0.1.0
 */
public abstract class FileBasedAgentCodeService implements AgentCodeService {

    protected final Logger logger = LoggerFactory.getLogger(this.getClass());

    protected final List<AgentCode> codeList = new ArrayList<>();

    FileBasedAgentCodeService(ResourceLoader resourceLoader) {
        this.codeList.addAll(parseFile(resourceLoader));
    }

    static String getFilePath(String filename) {
        String pluginPathPart = "onkostar/files/onkostar/plugins/onkostar-plugin-atccodes";

        if (SystemUtils.IS_OS_WINDOWS) {
            return String.format("file:///c:/%s/%s", pluginPathPart, filename);
        } else if (SystemUtils.IS_OS_LINUX) {
            return String.format("file:///opt/%s/%s", pluginPathPart, filename);
        }
        return filename;
    }

    protected abstract List<AgentCode> parseFile(ResourceLoader resourceLoader);

    /**
     * Queries source for agents code starting with or name containing query string.
     * If size is zero, all available results will be returned.
     *
     * @param query The query string
     * @param size  Maximal amount of responses
     * @return A list with agent codes
     */
    @Override
    public List<AgentCode> findAgentCodes(String query, int size) {
        var resultStream = this.codeList.stream().filter(agentCode ->
                agentCode.getCode().toLowerCase().startsWith(query.toLowerCase())
                        || agentCode.getName().toLowerCase().contains(query.toLowerCase())
        );

        if (size > 0) {
            return resultStream.limit(size).collect(Collectors.toList());
        }
        return resultStream.collect(Collectors.toList());
    }

}
