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
import de.ukw.ccc.onkostar.atccodes.AtcCode;
import de.ukw.ccc.onkostar.atccodes.FileParsingException;
import org.apache.commons.csv.CSVFormat;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Service to query for agent codes based on WHO xml file
 *
 * @author Paul-Christian Volkmer
 * @since 0.1.0
 */
@Service
public class CsvAtcCodeService extends FileBasedAgentCodeService {

    public CsvAtcCodeService(final ResourceLoader resourceLoader) {
        super(resourceLoader);
    }

    protected List<AgentCode> parseFile(final ResourceLoader resourceLoader) {
        var result = new ArrayList<AgentCode>();
        var filename = getFilePath("atc.csv");
        try {
            var inputStream = resourceLoader.getResource(filename).getInputStream();
            var parser = CSVFormat.RFC4180
                    .withHeader()
                    .withSkipHeaderRecord()
                    .parse(new InputStreamReader(inputStream));
            for (var row : parser) {
                if (!row.isMapped("CODE") || !row.isMapped("NAME")) {
                    throw new FileParsingException("No CSV column 'CODE' or 'NAME' found");
                }
                if (row.isMapped("VERSION")) {
                    result.add(new AtcCode(row.get("CODE"), row.get("NAME"), row.get("VERSION")));
                } else {
                    result.add(new AtcCode(row.get("CODE"), row.get("NAME")));
                }
            }
            logger.info("Found CSV file for ATC-Codes.");
            return result;
        } catch (IOException | FileParsingException e) {
            logger.warn("Error reading CSV file '{}' for ATC-Codes. Proceeding without data", filename);
        }
        return result;
    }

}
